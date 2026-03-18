import { jUnit, textSummary } from '../../libs/k6-summary/0.0.1/index.js';
import { htmlReport } from '../../libs/k6-reporter/2.4.0/bundle.js';
import encoding from 'k6/encoding';

var replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
}

var defaultOptions = {
    indent: ' ',
    enableColors: true,
    summaryTimeUnit: null,
    summaryTrendStats: null,
}

var forEach = function (obj, callback) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (callback(key, obj[key])) {
                break
            }
        }
    }
}

function escapeHTML(str) {
    // TODO: something more robust?
    return str.replace(/[&<>'"]/g, function (char) {
        return replacements[char]
    })
}

function getMetricValue(metric, thresholdName, options) {
    var mymessage = ''

    if (metric.type == 'trend') {
        for (var i = 0; i < options.summaryTrendStats.length; i++) {
            var tc = options.summaryTrendStats[i]
            var value = metric.values[tc]
            if (tc === 'count') {
                mymessage = value.toString()
            } else {
                var myThreshold = thresholdName.split(/[>|<|=]/) ;
                mymessage = metric.values[myThreshold[0].trim()].toFixed(2) + 'ms';
            }
        }
    } else if (metric.type == 'gauge') {
        mymessage = parseFloat(metric.values.value).toFixed(6).toString();
    } else if (metric.type == 'rate') {
        mymessage = (Math.trunc(metric.values.rate * 100 * 100) / 100).toFixed(2) + '%';
    } else if (metric.type == 'counter') {
        mymessage = metric.values.rate.toFixed(2) + '/s';
    } else {
       mymessage = metric.type;
    }

    return mymessage;
}

function addEvidence(fileName, fileEvidence) {
    var item = '';
    if (fileName && fileEvidence) {
        item = '<item name="' + fileName + '">' +
            fileEvidence +
            '</item>';
    }

    return item;
}

function generateXrayJUnitXML(data, fileName = '', fileContent = '', options) {
    var failures = 0
    var cases = []
    var mergedOpts = Object.assign({}, defaultOptions, data.options, options);

    forEach(data.metrics, function (metricName, metric) {
        if (!metric.thresholds) {
            return
        }
        forEach(metric.thresholds, function (thresholdName, threshold) {
            if (threshold.ok) {
                cases.push(
                    '<testcase name="'+ `${__ENV.PROJECT_KEY} ` + `${__ENV.SCRIPT_NAME} `+  escapeHTML(metricName) + ' - ' + escapeHTML(thresholdName) + '">' +
                    '<system-out><![CDATA[Value registered for ' + metricName + ' is within the expected values(' + thresholdName + '). Actual values: ' + metricName + ' = ' + getMetricValue(metric, thresholdName, mergedOpts) + ']]></system-out>' +
                    '<properties>' +
                    '<property name="testrun_comment"><![CDATA[Value registered for ' + metricName + ' is within the expected values- ' + thresholdName + '. Actual value: ' + getMetricValue(metric, thresholdName, mergedOpts) + ']]></property>' +
                    '<property name="test_description"><![CDATA[Threshold for ' + metricName + ']]></property>' +
                    '<property name="test_summary" value="'+ `${__ENV.PROJECT_KEY} `+`${__ENV.SCRIPT_NAME} ` + escapeHTML(metricName) + ' - ' + escapeHTML(thresholdName) + '"/>' +
                    '</properties>' +
                    '</testcase>'
                )
            } else {
                failures++
                cases.push(
                    '<testcase name="'+ `${__ENV.PROJECT_KEY} `+ `${__ENV.SCRIPT_NAME} `+  escapeHTML(metricName) + ' - ' + escapeHTML(thresholdName) + '">' +
                    '<failure message="Value registered for ' + metricName + ' is not within the expected values(' + escapeHTML(thresholdName) + '). Actual values: ' + escapeHTML(metricName) + ' = ' + getMetricValue(metric, thresholdName, mergedOpts) + '" />' +
                    '<properties>' +
                    '<property name="testrun_comment"><![CDATA[Value registered for ' + metricName + ' is not within the expected values - ' + thresholdName +  '. Actual value: ' + getMetricValue(metric, thresholdName, mergedOpts) + ']]></property>' +
                    '<property name="test_description"><![CDATA[Threshold for ' + metricName + ']]></property>' +
                    '<property name="test_summary" value="'+ `${__ENV.PROJECT_KEY} ` + `${__ENV.SCRIPT_NAME} `+ escapeHTML(metricName) + ' - ' + escapeHTML(thresholdName) + '"/>' +
                    '<property name="testrun_evidence">' +
                    addEvidence(fileName, fileContent) +
                    '</property>' +
                    '</properties>' +
                    '</testcase>'
                )
            }
        })
    })

    var name = options && options.name ? escapeHTML(options.name) : 'k6 thresholds'

    return (
        '<?xml version="1.0"?>\n<testsuites tests="' +
        cases.length +
        '" failures="' +
        failures +
        '">\n' +
        '<testsuite name="' +
        name +
        '" tests="' +
        cases.length +
        '" failures="' +
        failures +
        '">' +
        cases.join('\n') +
        '\n</testsuite >\n</testsuites >'
    )
}

export function generalSummary(data) {
    console.log('Preparing the end-of-test summary...');

    return {
      stdout: textSummary(data, { indent: ' ', enableColors: true }), // Show the text summary to stdout...
      './reports/junit.xml': jUnit(data), // but also transform it and save it as a JUnit XML...
      './reports/summary.json': JSON.stringify(data), // and a JSON with all the details...
      './reports/xrayJunit.xml': generateXrayJUnitXML(
        data,
        'summary.json',
        encoding.b64encode(JSON.stringify(data))
      ),
      './reports/summary.html': htmlReport(data),
      './reports/textSummary.txt': textSummary(data, { indent: ' ', enableColors: false }),
      // And any other JS transformation of the data you can think of,
      // you can write your own JS helpers to transform the summary data however you like!
    };
}