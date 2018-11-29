/*
 * given a list of xpoints
 * the function returns a list of points
 * from xrange as close to xpoints as possible
 *
 **/
function get_matching_xy(chart, xpoints, ypoints) {
    // get total chart widht to get x scale width
    const chartArea = chart.chartArea;
    const chartWidth = chartArea.right - chartArea.left;

    // get number of ticks
    const scales = chart.scales['x-axis-0'];
    const ticks = scales.ticks.length;

    // total width divided by ticks
    const xscale = chartWidth/(ticks-1);

    // get starting x point
    const startx = chartArea.left;

    // create a set to avoid duplicates
    const matchingSet = new Set();

    const matchingPoints = {
        x: [],
        y: []
    };

    // use the middle of two x-ticks as the threshold
    const threshold = xscale/10;
    for (let k = 0; k < xpoints.length; ++k) {
        const xpoint = xpoints[k];
        const ypoint = ypoints[k];
        for (let i = 0; i < ticks; ++i) {
            const x = startx + xscale*i;
            const diff = Math.abs(xpoint - x);
            if (diff <= threshold && !matchingSet.has(i)) {
                matchingSet.add(i);

                const y = scale_y(chart, ypoint);

                // add x, y to matching points dict
                matchingPoints.x.push(i);
                matchingPoints.y.push(y);

                break;
            }
        }
    }

    return matchingPoints;
}

/*
 * scale clicked area in canvas to chart area
 *
 **/
function scale_y(chart, ypoint) {
    // get number of ticks
    const scales = chart.scales['y-axis-0'];
    const ticks = scales.ticks;
    const tickLength = ticks.length;

    // get total chart area to get y scale width
    const chartArea = chart.chartArea;

    // total width divided by ticks
    const chartHeight = chartArea.bottom - chartArea.top;
    const yscale = chartHeight/(tickLength-1);

    // use top of chart as starting point
    const starty = chartArea.top;

    // use middle as threshold
    const threshold = yscale/2;
    for (let i = 0; i < tickLength; ++i) {
        const y = starty + yscale*i;
        const diff = Math.abs(ypoint - y);

        if (diff <= threshold) {
            return ticks[i];
        }
    }

    // if less than start, return the first point
    if (ypoint < starty) {
        return ticks[0];
    }

    return ticks[tickLength - 1];
}

/*
 * match the passed dataset according to matching points and slope data
 *
 **/
function match_slope(dataset, matchingPoints) {
    // if not enough points, do anything
    if (matchingPoints.x.length < 2) {
        return true;
    }

    // get internal data
    const data = dataset.data;

    const threshold = 20;
    for (let i = 0; i < matchingPoints.x.length - 1; ++i) {
        // get required x values to get y data from dataset
        const x1 = matchingPoints.x[i];
        const x2 = matchingPoints.x[i+1];

        // get corresponding ydata in dataset
        const dy1 = data[x1];
        const dy2 = data[x2];

        // calculate data slope
        const dslope = (dy2 - dy1)/(x2 - x1);

        // curved lined y data
        const y1 = matchingPoints.y[i];
        const y2 = matchingPoints.y[i+1];

        // get curved line slope
        const slope = (y2 - y1)/(x2 - x1);

        const slopeDiff = Math.abs(slope - dslope);

        if (slopeDiff > threshold) {
            return false;
        }
    }

    return true;
}

/*
 * given a set of xpoints, the function filters the datasets
 * and outputs those lines which match closely to the given parameters
 *
 **/
function filter_lines(chart, xpoints, ypoints) {
    // get similar xpoints in the actual xrange
    const matchingPoints = get_matching_xy(chart, xpoints, ypoints);

    // get datasets;
    const datasets = chart.data.datasets;

    const filtered_datasets = [];
    for (const dataset of datasets) {
        if (match_slope(dataset, matchingPoints)) {
            filtered_datasets.push(dataset);
        }
    }

    createChart(filtered_datasets);
}
