const fs = require('fs');

function make_email_address(config, suffix) {
    const [account, domain] = config.email.split('@');
    return account + '+' + suffix + '@' + domain;
}

function makeRandomEmail(config, prefix) {
    if (!prefix) prefix = '';
    return make_email_address(config, prefix + Math.random().toString(36).slice(2));
}

async function readFile(fileName, type) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, type, (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}

async function wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(func, waitTimes) {
    for (const w of waitTimes) {
        const res = await func();
        if (res) return res;
        await wait(w);
    }
    return await func();
}

function randomHex() {
    return [
        '0', '1', '2', '3', '4', '5', '6', '7',
        '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 16)];
}

function randomHexstring(len) {
    let res = '';
    while (len-- > 0) {
        res += randomHex();
    }
    return res;
}

function regexEscape(s) {
    // From https://stackoverflow.com/a/3561711/35070
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function* range(count) {
    for (let i = 0;i < count;i++) {
        yield i;
    }
}

// Range as array
function arange(count) {
    return Array.from(range(count));
}

function count(ar, filter) {
    let res = 0;
    for (var el of ar) {
        if (filter(el)) res++;
    }
    return res;
}

function pluck(obj, keys) {
    const res = {};
    for (const k of keys) {
        if (obj.hasOwnProperty(k)) {
            res[k] = obj[k];
        }
    }
    return res;
}

// Remove the element for which callback returns true from the array.
function remove(array, callback) {
    for (let i = 0;i < array.length;i++) {
        if (callback(array[i])) {
            array.splice(i, 1);
            return;
        }
    }
    throw new Error('Did not remove anything');
}

function filterMap(ar, cb) {
    const res = [];
    for (let i = 0;i < ar.length;i++) {
        const mapped = cb(ar[i], i);
        if (mapped) {
            res.push(mapped);
        }
    }
    return res;
}

const _pad = num => ('' + num).padStart(2, '0');

function timezoneOffsetString(offset) {
    if (!offset) return 'Z';

    const sign = (offset < 0) ? '+' : '-';
    offset = Math.abs(offset);
    const minutes = offset % 60;
    const hours = (offset - minutes) / 60;
    return sign + _pad(hours) + ':' + _pad(minutes);
}

function localIso8601(date) {
    if (!date) date = new Date();

    // Adapted from: https://stackoverflow.com/a/8563517/35070
    return (
        date.getFullYear()
        + '-' + _pad(date.getMonth() + 1)
        + '-' + _pad(date.getDate())
        + 'T' + _pad(date.getHours())
        + ':' + _pad(date.getMinutes())
        + ':' + _pad(date.getSeconds())
        + '.' + String((date.getMilliseconds() / 1000).toFixed(3)).slice(2, 5)
        + timezoneOffsetString(date.getTimezoneOffset())
    );
}

module.exports = {
    arange,
    count,
    filterMap,
    localIso8601,
    make_email_address,
    makeRandomEmail,
    pluck,
    randomHex,
    randomHexstring,
    range,
    regexEscape,
    readFile,
    remove,
    retry,
    timezoneOffsetString,
    wait,
};
