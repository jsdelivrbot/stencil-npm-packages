"use strict";
var fs = require("fs");
var glob = require("glob");
var optimist = require("optimist");
var path = require("path");
var Linter = require("./tslint");
var configuration_1 = require("./configuration");
var test_1 = require("./test");
var processed = optimist
    .usage("Usage: $0 [options] [file ...]")
    .check(function (argv) {
    if (!(argv.h || argv.i || argv.test || argv.v || argv._.length > 0)) {
        throw "Missing files";
    }
    if (argv.f) {
        throw "-f option is no longer available. Supply files directly to the tslint command instead.";
    }
})
    .options({
    "c": {
        alias: "config",
        describe: "configuration file",
    },
    "force": {
        describe: "return status code 0 even if there are lint errors",
        "type": "boolean",
    },
    "h": {
        alias: "help",
        describe: "display detailed help",
    },
    "i": {
        alias: "init",
        describe: "generate a tslint.json config file in the current working directory",
    },
    "o": {
        alias: "out",
        describe: "output file",
    },
    "r": {
        alias: "rules-dir",
        describe: "rules directory",
    },
    "s": {
        alias: "formatters-dir",
        describe: "formatters directory",
    },
    "e": {
        alias: "exclude",
        describe: "exclude globs from path expansion",
    },
    "t": {
        alias: "format",
        default: "prose",
        describe: "output format (prose, json, verbose)",
    },
    "test": {
        describe: "test that tslint produces the correct output for the specified directory",
    },
    "v": {
        alias: "version",
        describe: "current version",
    },
});
var argv = processed.argv;
var outputStream;
if (argv.o != null) {
    outputStream = fs.createWriteStream(argv.o, {
        flags: "w+",
        mode: 420,
    });
}
else {
    outputStream = process.stdout;
}
if (argv.v != null) {
    outputStream.write(Linter.VERSION + "\n");
    process.exit(0);
}
if (argv.i != null) {
    if (fs.existsSync(configuration_1.CONFIG_FILENAME)) {
        console.error("Cannot generate " + configuration_1.CONFIG_FILENAME + ": file already exists");
        process.exit(1);
    }
    var tslintJSON = JSON.stringify(configuration_1.DEFAULT_CONFIG, undefined, "    ");
    fs.writeFileSync(configuration_1.CONFIG_FILENAME, tslintJSON);
    process.exit(0);
}
if (argv.test != null) {
    var results = test_1.runTest(argv.test);
    var didAllTestsPass = test_1.consoleTestResultHandler(results);
    process.exit(didAllTestsPass ? 0 : 1);
}
if ("help" in argv) {
    outputStream.write(processed.help());
    var outputString = "\ntslint accepts the following commandline options:\n\n    -c, --config:\n        The location of the configuration file that tslint will use to\n        determine which rules are activated and what options to provide\n        to the rules. If no option is specified, the config file named\n        tslint.json is used, so long as it exists in the path.\n        The format of the file is { rules: { /* rules list */ } },\n        where /* rules list */ is a key: value comma-seperated list of\n        rulename: rule-options pairs. Rule-options can be either a\n        boolean true/false value denoting whether the rule is used or not,\n        or a list [boolean, ...] where the boolean provides the same role\n        as in the non-list case, and the rest of the list are options passed\n        to the rule that will determine what it checks for (such as number\n        of characters for the max-line-length rule, or what functions to ban\n        for the ban rule).\n\n    -e, --exclude:\n        A filename or glob which indicates files to exclude from linting.\n        This option can be supplied multiple times if you need multiple\n        globs to indicate which files to exclude.\n\n    --force:\n        Return status code 0 even if there are any lint errors.\n        Useful while running as npm script.\n\n    -i, --init:\n        Generates a tslint.json config file in the current working directory.\n\n    -o, --out:\n        A filename to output the results to. By default, tslint outputs to\n        stdout, which is usually the console where you're running it from.\n\n    -r, --rules-dir:\n        An additional rules directory, for user-created rules.\n        tslint will always check its default rules directory, in\n        node_modules/tslint/lib/rules, before checking the user-provided\n        rules directory, so rules in the user-provided rules directory\n        with the same name as the base rules will not be loaded.\n\n    -s, --formatters-dir:\n        An additional formatters directory, for user-created formatters.\n        Formatters are files that will format the tslint output, before\n        writing it to stdout or the file passed in --out. The default\n        directory, node_modules/tslint/build/formatters, will always be\n        checked first, so user-created formatters with the same names\n        as the base formatters will not be loaded.\n\n    -t, --format:\n        The formatter to use to format the results of the linter before\n        outputting it to stdout or the file passed in --out. The core\n        formatters are prose (human readable), json (machine readable)\n        and verbose. prose is the default if this option is not used. Additonal\n        formatters can be added and used if the --formatters-dir option is set.\n\n    --test:\n        Runs tslint on the specified directory and checks if tslint's output matches\n        the expected output in .lint files. Automatically loads the tslint.json file in the\n        specified directory as the configuration file for the tests. See the\n        full tslint documentation for more details on how this can be used to test custom rules.\n\n    -v, --version:\n        The current version of tslint.\n\n    -h, --help:\n        Prints this help message.\n";
    outputStream.write(outputString);
    process.exit(0);
}
if (argv.c && !fs.existsSync(argv.c)) {
    console.error("Invalid option for configuration: " + argv.c);
    process.exit(1);
}
var possibleConfigAbsolutePath = argv.c != null ? path.resolve(argv.c) : null;
var processFile = function (file) {
    if (!fs.existsSync(file)) {
        console.error("Unable to open file: " + file);
        process.exit(1);
    }
    var contents = fs.readFileSync(file, "utf8");
    var configuration = configuration_1.findConfiguration(possibleConfigAbsolutePath, file);
    var linter = new Linter(file, contents, {
        configuration: configuration,
        formatter: argv.t,
        formattersDirectory: argv.s,
        rulesDirectory: argv.r,
    });
    var lintResult = linter.lint();
    if (lintResult.failureCount > 0) {
        outputStream.write(lintResult.output, function () {
            process.exit(argv.force ? 0 : 2);
        });
    }
};
var files = argv._;
for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
    var file = files_1[_i];
    glob.sync(file, { ignore: argv.e }).forEach(processFile);
}
