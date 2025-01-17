"use strict";
var utils_1 = require("./language/utils");
var configuration_1 = require("./configuration");
var enableDisableRules_1 = require("./enableDisableRules");
var formatterLoader_1 = require("./formatterLoader");
var ruleLoader_1 = require("./ruleLoader");
var utils_2 = require("./utils");
var Linter = (function () {
    function Linter(fileName, source, options) {
        this.fileName = fileName;
        this.source = source;
        this.options = options;
        this.computeFullOptions();
    }
    Linter.prototype.lint = function () {
        var failures = [];
        var sourceFile = utils_1.getSourceFile(this.fileName, this.source);
        var rulesWalker = new enableDisableRules_1.EnableDisableRulesWalker(sourceFile, {
            disabledIntervals: [],
            ruleName: "",
        });
        rulesWalker.walk(sourceFile);
        var enableDisableRuleMap = rulesWalker.enableDisableRuleMap;
        var rulesDirectories = this.options.rulesDirectory;
        var configuration = this.options.configuration.rules;
        var configuredRules = ruleLoader_1.loadRules(configuration, enableDisableRuleMap, rulesDirectories);
        var enabledRules = configuredRules.filter(function (r) { return r.isEnabled(); });
        for (var _i = 0, enabledRules_1 = enabledRules; _i < enabledRules_1.length; _i++) {
            var rule = enabledRules_1[_i];
            var ruleFailures = rule.apply(sourceFile);
            for (var _a = 0, ruleFailures_1 = ruleFailures; _a < ruleFailures_1.length; _a++) {
                var ruleFailure = ruleFailures_1[_a];
                if (!this.containsRule(failures, ruleFailure)) {
                    failures.push(ruleFailure);
                }
            }
        }
        var formatter;
        var formattersDirectory = configuration_1.getRelativePath(this.options.formattersDirectory);
        var Formatter = formatterLoader_1.findFormatter(this.options.formatter, formattersDirectory);
        if (Formatter) {
            formatter = new Formatter();
        }
        else {
            throw new Error("formatter '" + this.options.formatter + "' not found");
        }
        var output = formatter.format(failures);
        return {
            failureCount: failures.length,
            failures: failures,
            format: this.options.formatter,
            output: output,
        };
    };
    Linter.prototype.containsRule = function (rules, rule) {
        return rules.some(function (r) { return r.equals(rule); });
    };
    Linter.prototype.computeFullOptions = function () {
        var _a = this.options, configuration = _a.configuration, rulesDirectory = _a.rulesDirectory;
        if (configuration == null) {
            configuration = configuration_1.DEFAULT_CONFIG;
        }
        this.options.rulesDirectory = utils_2.arrayify(rulesDirectory).concat(utils_2.arrayify(configuration.rulesDirectory));
        this.options.configuration = configuration;
    };
    Linter.VERSION = "3.7.1";
    Linter.findConfiguration = configuration_1.findConfiguration;
    Linter.findConfigurationPath = configuration_1.findConfigurationPath;
    Linter.getRulesDirectories = configuration_1.getRulesDirectories;
    Linter.loadConfigurationFromPath = configuration_1.loadConfigurationFromPath;
    return Linter;
}());
module.exports = Linter;
