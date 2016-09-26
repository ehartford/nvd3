nv.models.bubbleChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------
    var margin = {top: 2, right: 0, bottom: 2, left: 0}
        , width = 800
        , height = 400
        , container = null
        , dispatch = d3.dispatch('renderEnd')
        , color = nv.utils.getColor(['#000'])
        , tooltip = nv.models.tooltip()
        , noData = null
        // Force directed graph specific parameters [default values]
        , linkStrength = 0.1
        , friction = 0.9
        , linkDist = 30
        , charge = -120
        , gravity = 0.1
        , theta = 0.8
        , alpha = 0.1
        , radius = 5
        , getX = d3.functor(0.0)
        , getY = d3.functor(0.0)
        // These functions allow to add extra attributes to ndes and links
        , nodeExtras = function (nodes) { /* Do nothing */
        }
        , linkExtras = function (links) { /* Do nothing */
        }
        , center = {x: width / 2.0, y: height / 2.0}
        , year_centers = {
            '2008': {x: width / 3.0, y: height / 2.0},
            '2009': {x: width / 2.0, y: height / 2.0},
            '2010': {x: 2.0 * width / 3.0, y: height / 2.0}
        }
        , layout_gravity = -0.01
        , damper = 0.1
        , vis = null
        , nodes = []
        , force = null
        , circles = null
        , fill_color = d3.scale.ordinal()
            .domain(["low", "medium", "high"])
            .range(["#d84b2a", "#beccae", "#7aa25c"])
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();

        selection.each(function (data) {

            var max_amount = d3.max(data, function (d) {
                return parseInt(d.total_amount);
            });
            var radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);
   
            data = data.map(function (d) {
                return {
                    id: d.id,
                    radius: radius_scale(parseInt(d.total_amount)),
                    value: parseInt(d.total_amount),
                    name: d.grant_title,
                    org: d.organization,
                    group: d.group,
                    year: d.start_year,
                    x: Math.random() * width,
                    y: Math.random() * height
                };
            }).sort(function (a, b) {
                return b.value - a.value;
            });

            container = d3.select(this);
            nv.utils.initSVG(container);

            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin);

            container
                .attr("width", availableWidth)
                .attr("height", availableHeight);

            // Display No Data message if there's nothing to show.
            if (!data) {
                nv.utils.noData(chart, container)
                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }
            container.selectAll('*').remove();

            var circles = container.selectAll("circle")
                .data(data, function (d) {
                    return d.id;
                });

            var that = this;

            circles
                .enter()
                .append("circle")
                .attr("r", 0)
                .attr("cx", function(d){
                    return d.x;
                })
                .attr("cy", function(d){
                    return d.y;
                })
                .style("fill", function (d) {
                    return fill_color(d.group);
                })
                .attr("stroke-width", 2)
                .attr("stroke", function (d) {
                    return d3.rgb(fill_color(d.group)).darker();
                })
                .attr("id", function (d) {
                    return "bubble_" + d.id;
                })
                .on("mouseover", function (d, i) {
                    //return that.show_details(d, i, this);
                })
                .on("mouseout", function (d, i) {
                    //return that.hide_details(d, i, this);
                });

            circles.transition().duration(2000).attr("r", function(d) { return d.radius;});

            tooltip.headerFormatter(function (d) {
                return "Node";
            });

            // Apply extra attributes to nodes and links (if any)
            //linkExtras(link);
            //nodeExtras(node);

            var charge = function (d) {
                return -Math.pow(d.radius, 2.0) / 8;
            };

            var move_towards_center = function (alpha) {
                return function(d) {
                    d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
                    d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
                }
            };

            var start = function(){
                force = d3.layout.force()
                    .nodes(data)
                    .size([width, height])
            };

            var display_group_all = function () {
                force.gravity(layout_gravity)
                    .charge(charge)
                    .friction(0.9)
                    .on("tick", function (e) {
                        circles.each(move_towards_center(e.alpha))
                        .attr("cx", function (d) {return d.x;})
                        .attr("cy", function (d) {return d.y;})});
                force.start()
            }
            start();

            display_group_all();

        });

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {get: function () {return width;}, set: function (_) {width = _;}},
        height: {get: function () {return height;}, set: function (_) {height = _;}},
        center: {get: function() {return {x: width / 2.0, y: height / 2.0};}},

        // Force directed graph specific parameters
        linkStrength: { get: function () { return linkStrength; }, set: function (_) { linkStrength = _; } },
        friction: { get: function () { return friction; }, set: function (_) { friction = _; } },
        linkDist: { get: function () { return linkDist; }, set: function (_) { linkDist = _; } },
        charge: { get: function () { return charge; }, set: function (_) { charge = _; } },
        gravity: { get: function () { return gravity; }, set: function (_) { gravity = _; } },
        theta: { get: function () { return theta; }, set: function (_) { theta = _; } },
        alpha: { get: function () { return alpha; }, set: function (_) { alpha = _; } },
        radius: { get: function () { return radius; }, set: function (_) { radius = _; } },

        //functor options
        x: { get: function () { return getX; }, set: function (_) { getX = d3.functor(_); } },
        y: { get: function () { return getY; }, set: function (_) { getY = d3.functor(_); } },

        // options that require extra logic in the setter
        margin: { get: function () { return margin; }, set: function (_) {
            margin.top = _.top !== undefined ? _.top : margin.top;
            margin.right = _.right !== undefined ? _.right : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left = _.left !== undefined ? _.left : margin.left; } },
        color: { get: function () { return color; }, set: function (_) { color = nv.utils.getColor(_); } },
        noData: { get: function () { return noData; }, set: function (_) { noData = _; } },
        nodeExtras: { get: function () { return nodeExtras; }, set: function (_) { nodeExtras = _; } },
        linkExtras: { get: function () { return linkExtras; }, set: function (_) { linkExtras = _; } }
    });

    chart.dispatch = dispatch;
    chart.tooltip = tooltip;
    nv.utils.initOptions(chart);
    return chart;
};
