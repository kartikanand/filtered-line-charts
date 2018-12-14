'use strict';

class FilterLineCharts {
    /*
     * given a set of dataset
     * return a list of labels from this dataset
     * the function assumes all datasets will have the same labels
     * and thus picks the first one
     *
     **/
    static getLabels (datasets) {
        const anyDataset = datasets[0];
        const anyData = anyDataset.data;
        const dataLength = anyData.length;

        const labels = [];
        for (let i = 0; i < dataLength; ++i) {
            labels.push(i);
        }

        return labels;
    }

    static filterGestureType(matchingPoints) {
        // if we need to match all slopes, just return
        const matchAll = document.getElementById('js-gestureAll');
        if (matchAll.checked) {
            return matchingPoints;
        }

        // we need to remove all x axis points except start and finish
        // get all x values
        const xKeys = matchingPoints.x;
        const pointsLength = xKeys.length;

        // if max no. of points is 2, just return
        if (pointsLength < 3) {
            return matchingPoints;
        }

        const yKeys = matchingPoints.y;

        // create a new dictionary to return
        const filteredMatchingPoints = {
            x: [], y: []
        };

        // get only first and last x point
        filteredMatchingPoints.x = [xKeys[0], xKeys[pointsLength - 1]];
        filteredMatchingPoints.y = [yKeys[0], yKeys[pointsLength - 1]];

        return filteredMatchingPoints;
    }

    /*
     * given a list of x and y points
     * the function returns a dictionary of xy points
     * from xrange, yrange as close to xpoints, ypoints as possible
     *
     **/
    static getMatchingXY (chart, xpoints, ypoints) {
        // get total chart width to get x scale width
        const chartArea = chart.chartArea;
        const chartWidth = chartArea.right - chartArea.left;

        // get number of ticks
        const scales = chart.scales['x-axis-0'];
        const ticks = scales.ticks.length;

        // total width divided by ticks
        const xscale = chartWidth/(ticks-1);

        // get starting x point
        const startx = chartArea.left;

        const matchingPoints = {
            x: [],
            y: []
        };

        // use the middle of two x-ticks as the threshold
        const threshold = xscale/3;
        for (let i = 0; i < ticks; ++i) {
            const x = startx + xscale*i;
            let minDist = xscale;
            for (let k = 0; k < xpoints.length; ++k) {
                const xpoint = xpoints[k];
                const diff = Math.abs(xpoint - x);
                if (diff >= threshold) {
                    continue;
                }

                if (diff < minDist) {
                    minDist = diff;
                } else {
                    const ypoint = ypoints[k];
                    const y = FilterLineCharts.scale_y(chart, ypoint);

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
     * get the ypoint as close to yrange as possible
     *
     **/
    static scale_y (chart, ypoint) {
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
    static matchSlope (dataset, matchingPoints, xscale, yscale) {
        // if not enough points, do anything
        if (matchingPoints.x.length < 2) {
            return true;
        }

        // get internal data
        const data = dataset.data;

        const threshold = yscale/xscale + 10;
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

    constructor (chartId) {
        this.canvas = document.getElementById(chartId);
        this.ctx = this.canvas.getContext("2d");
        this.chart = null;

        // get random datasets originally and save for reset
        this.origDatasets = getRandomDatasets(10, -100, 100, 20);

        // we'll always draw current datasets
        this.currDatasets = this.origDatasets;

        this.isDrawing = false;
        this.prevY = 0;
        this.prevX = 0;
        this.currX = 0;
        this.currY = 0;

        // color and width of gesture stroke
        this.color = "black";
        this.strokeWidth = 6;

        // bind functions
        this.resetPointsArray = this.resetPointsArray.bind(this);
        this.drawChart = this.drawChart.bind(this);
        this.draw = this.draw.bind(this);
        this.filterLines = this.filterLines.bind(this);
        this.drawEventHandler = this.drawEventHandler.bind(this);
        this.addEventHandlers = this.addEventHandlers.bind(this);

        this.resetPointsArray();

        // add mouse event handlers
        this.addEventHandlers();

        // draw initial chart
        this.drawChart();
    }

    getxScale() {
        // get total chart width to get x scale width
        const chartArea = this.chart.chartArea;
        const chartWidth = chartArea.right - chartArea.left;

        // get number of ticks
        const scales = this.chart.scales['x-axis-0'];
        const ticks = scales.ticks.length;

        // total width divided by ticks
        const xscale = chartWidth/(ticks-1);

        return xscale;
    }

    getyScale() {
        // get number of ticks
        const scales = this.chart.scales['y-axis-0'];
        const ticks = scales.ticks;
        const tickLength = ticks.length;

        // get total chart area to get y scale width
        const chartArea = this.chart.chartArea;

        // total width divided by ticks
        const chartHeight = chartArea.bottom - chartArea.top;
        const yscale = chartHeight/(tickLength-1);

        return yscale;
    }

    drawChart () {
        // dont' do anything for no datasets
        if (this.currDatasets.length < 1) {
            return;
        }

        // get labels from within the dataset
        const labels = FilterLineCharts.getLabels(this.currDatasets);

        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: this.currDatasets
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                },
                scales: {
                    xAxes: [{
                        display: true,
                    }],
                    yAxes: [{
                        display: true,
                    }]
                },
                animation: {
                    duration: 0
                },
                tooltips: {
                    enabled: false
                },
                hover: {
                    mode: null
                }
            }
        };

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, config);
    }

    /*
     * given a set of xpoints, the function filters the datasets
     * and outputs those lines which match closely to the given parameters
     *
     **/
    filterLines () {
        // get similar xpoints in the actual xrange
        let matchingPoints = FilterLineCharts.getMatchingXY(this.chart,
            this.xpoints, this.ypoints);

        // remove matching points according to gesture type selected
        matchingPoints = FilterLineCharts.filterGestureType(matchingPoints);

        // get datasets;
        const datasets = this.currDatasets;

        const filteredDatasets = [];
        for (const dataset of datasets) {
            if (FilterLineCharts.matchSlope(dataset, matchingPoints, this.getxScale(), this.getyScale())) {
                filteredDatasets.push(dataset);
            }
        }

        this.currDatasets = filteredDatasets;
        this.drawChart();
    }

    resetPointsArray () {
        this.xpoints = [];
        this.ypoints = [];
    }

    draw () {
        // get context in a variable to avoid writing this everytime
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.currX, this.currY);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;

        ctx.stroke();
        ctx.closePath();
    }

    drawEventHandler (evnt) {
        // don't do anything special
        evnt.preventDefault();

        // get context in a variable to avoid writing this everytime
        const ctx = this.ctx;

        // get current mouse event type, and do things according to it
        const res = evnt.type;
        if (res == 'mousedown') {
            // reset points array and start drawing
            this.resetPointsArray();
            this.isDrawing = true;

            this.currX = evnt.clientX - this.canvas.offsetLeft;
            this.currY = evnt.clientY - this.canvas.offsetTop;
        } else if (res == 'mouseup' || res == 'mouseout') {
            if (this.isDrawing) {
                this.filterLines(window.chart, this.xpoints, this.ypoints);
                this.isDrawing = false;
            }
        } else if (res == 'mousemove') {
            if (this.isDrawing) {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = evnt.clientX - this.canvas.offsetLeft;
                this.currY = evnt.clientY - this.canvas.offsetTop;

                // add to our points array for filtering lines
                this.xpoints.push(this.currX);
                this.ypoints.push(this.currY);

                this.draw();
            }
        }
    }

    addEventHandlers() {
        this.canvas.addEventListener("mousemove", this.drawEventHandler, false);
        this.canvas.addEventListener("mousedown", this.drawEventHandler, false);
        this.canvas.addEventListener("mouseup", this.drawEventHandler, false);
        this.canvas.addEventListener("mouseout", this.drawEventHandler, false);
    }
}
