'use strict';

// array of colors for getting a random color
const COLORS = [
    '#4dc9f6',
    '#f67019',
    '#f53794',
    '#537bc4',
    '#acc236',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba'
];

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
 * get a list of x data points which range from low to high
 *
 **/
function getDatapoints(x, low, high) {
    const data = [];

    for (let i = 0; i < x; ++i) {
        data.push(getRandomInt(low, high));
    }

    return data;
}

/*
 * get a single dataset with x data points
 * where each data point ranges from low to high
 *
 **/
function getRandomDataset(x, indx, low, high) {
    const colorIndex = getRandomInt(0, COLORS.length - 1);
    const color = COLORS[colorIndex];

    const dataset = {
        label: '#' + String(indx),
        backgroundColor: color,
        borderColor: color,
        data: getDatapoints(x, low, high),
        fill: false,
        lineTension: 0
    };

    return dataset;
}

/*
 * get a list of n datasets where each dataset has
 * x no. of entries where each data point ranges from
 * low to high
 *
 **/
function getRandomDatasets(x, low, high, n) {
    const datasets = [];

    for (let i = 0; i < n; ++i) {
        datasets.push(getRandomDataset(x, i, low, high));
    }

    return datasets;
}
