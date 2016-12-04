function VoronoiMap() {

    var me = this;

    var current_loss = null;

    var bounds = VMT.mapholder.map.getBounds(),
    topLeft = VMT.mapholder.map.latLngToLayerPoint(bounds.getNorthWest()),
    bottomRight = VMT.mapholder.map.latLngToLayerPoint(bounds.getSouthEast())
        
    var voronoi_fn = d3.voronoi()
            .x(function(d) {
                return d.x ;  //To avoid two points being at the same pixel values and therefore having an uncomputable voronoi
            })
            .y(function(d) {
                return d.y ;  //To avoid two points being at the same pixel values
            })
            .extent([
                [0, 0],
                [bottomRight.x, bottomRight.y]
            ])

    this.previous_hover_court = {}

    this.draw_from_scratch = function() {

        console.log("drawing from scratch")

        //Get layers 
    
        me.voronoi_cells_layer = d3.select("#voronoi_cells_layer")
        me.demand_lines_layer = d3.select("#demand_lines_layer")
        me.demand_points_layer = d3.select("#demand_points_layer")
        me.facility_location_layer = d3.select("#facility_location_layer")
        me.voronoi_borders_layer = d3.select("#voronoi_borders_layer")
        me.clip_path_layer = d3.select("#clip_path_layer")

        // Draw clip

        //Take the geojson stream and convert to the leaflet coordinate system
        function projectPoint(x, y) {
            var point = VMT.mapholder.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        var transform = d3.geoTransform({
            point: projectPoint
        })

        var path = d3.geoPath().projection(transform);

        //Draw the clipping path and apply it
        me.clip_path_layer.select("#EWClipPath").remove()
        me.clip_path_layer.append("svg:clipPath")
            .attr("id", "EWClipPath")
            .append("svg:path")
            .datum(VMT.geo_collection)
            .attr("d", path);

        me.voronoi_borders_layer.attr("clip-path", "url(#EWClipPath)")
        me.voronoi_cells_layer.attr("clip-path", "url(#EWClipPath)")

        // Draw cells
        redraw_voronoi()

    }

    this.court_on_mouseover = function(d) {
            var this_court = d.data

            //Want to know:  Total demand for this prison
            //Average travel time for this prison
            //Overall average travel time

            var this_prison = VMT.dataholder.prison_locations_dict[this_court.optimal_prison["dest_prison"]]
            var total_loss = VMT.dataholder.total_loss


            //Highlight the courts in this area
            me.voronoi_cells_layer.selectAll(".voronoicells")
                .style("fill-opacity", function(d2) {
                    if (d2.data.optimal_prison.dest_prison == this_court.optimal_prison.dest_prison) {
                        return $("#cell_opacity_input").val()*0.8
                    } else { return cell_opacity = $("#cell_opacity_input").val()}
                })

            var format = d3.format(",.1f")
            var perc_format = d3.format(".1%")
          


            var template_dict = {}
            template_dict["court_name"] = this_court.source_court
            template_dict["dest_prison"] = this_court.optimal_prison.dest_prison

            //Overall statistics
            template_dict["overall_average_duration"] = format(total_loss.overall_average_duration)
            template_dict["total_demand_assigned"] = format(total_loss.demand_allocated)
            template_dict["total_demand_unassigned"] = format(total_loss.demand_unallocated)
            template_dict["number_of_active_prisons"] = total_loss.number_of_active_prisons

            //Overall thresholds
            template_dict["overall_thesholds"] = []
            _.each(VMT.duration_thresholds, function(threshold) {
                template_dict["overall_thesholds"].push({"threshold": threshold, "percentage_under_threshold" : perc_format(total_loss["perc_demand_under_duration_" + threshold])})
            })

            //Court statistics
            template_dict["court_demand"] = format(this_court.demand)
            template_dict["unassigned_demand"] = format(this_court.demand_remaining)
            template_dict["court_distance"] = format(this_court.optimal_prison.distance)
            template_dict["court_duration"] = format(this_court.optimal_prison.duration)

            
            
            //Prison statistics
            var prison_capacity = VMT.dataholder.prison_locations_dict[this_court.optimal_prison.dest_prison].prison_capacity
            template_dict["prison_capacity"] = format(prison_capacity)

            //Compute capacity in use
            var total_demand = VMT.dataholder.prison_locations_dict[this_court.optimal_prison.dest_prison].cumulative_demand

            template_dict["capacity_in_use"] = format(total_demand)

            template_dict["total_catchment_closest"] = format(this_prison.total_catchment_closest)
            
            var denom = this_prison["cumulative_demand"]
            template_dict["this_prison_average_duration"] = format(this_prison["cumulative_duration"]/denom)
            template_dict["this_prison_average_distance"] = format(this_prison["cumulative_distance"]/denom)

            template_dict["this_prison_thresholds"] = []
            _.each(VMT.duration_thresholds, function(threshold) {
                template_dict["this_prison_thresholds"].push(
                    {"threshold": threshold, 
                    "percentage_under_threshold" : perc_format(this_prison["demand_under_duration_" + threshold]/this_prison["cumulative_demand"])})
            })

            template_dict["count_of_allocated_courts"] = this_prison["count_of_allocated_courts"]


            var source = $("#hp_info").html();
            var template = Handlebars.compile(source);
            var html = template(template_dict);
            d3.select('#hover_panel')
                .html(html)

            me.previous_hover_court.data = d


            //Add interactivity to template and set visibility
            _.each(["overall_stats", "prison_stats", "court_stats", "detail_stats", "threshold_stats"], function(d) {
                if (VMT.info_tab_visibility[d]) {
                    var display = ""
                } else {
                    var display = "none"
                }
                $("."+d).css("display", display);
            })
        
            $("#toggle_overall_stats, #toggle_prison_stats, #toggle_court_stats, #toggle_detail_stats, #toggle_threshold_stats").on("click", function(d) {
                var this_key = d.currentTarget.id.replace("toggle_", "")
                VMT.info_tab_visibility[this_key] = !VMT.info_tab_visibility[this_key]
                if (VMT.info_tab_visibility[this_key]) {
                    var display = ""
                } else {
                    var display = "none"
                }
                $("."+this_key).css("display", display);
            })


        }





    function redraw_voronoi() {

        console.log("redrawing voronoi")

        //Recompute closest courts
        VMT.dataholder.create_voronoi_dataset()

        var filtered_prisons = _.filter(VMT.dataholder.prison_locations, function(d) {
                    return d.activated
                })

        console.log("num filtered prisons: " + filtered_prisons.length )

        if (filtered_prisons.length == 0 ) {
            //If there are no prisons delete overlays and return
            me.voronoi_cells_layer.selectAll("path").remove()
            me.demand_lines_layer.selectAll("line").remove()

            return

            
        }

        console.log("num prisons: " + filtered_prisons.length)

        me.courts = VMT.dataholder.court_locations

        var bounds = VMT.mapholder.map.getBounds(),
        topLeft = VMT.mapholder.map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = VMT.mapholder.map.latLngToLayerPoint(bounds.getSouthEast())
            
        var voronoi_fn = d3.voronoi()
                .x(function(d) {
                    return d.x ;
                })
                .y(function(d) {
                    return d.y ;
                })
                .extent([
                    [-100000, -100000],
                    [100000, 100000]  //Need silly extent otherwise some circles get deleted when you zoom in too much
                ])

        // Convert lat lng to points
        VMT.dataholder.court_locations = _.each(VMT.dataholder.court_locations,function(d) {

            var latlng = new L.LatLng(d.lat, d.lng);
            var point = VMT.mapholder.map.latLngToLayerPoint(latlng);

            d.x = point.x + d3.randomUniform(-0.01,0.01)();
            d.y = point.y + d3.randomUniform(-0.01,0.01)();

            var latlng = new L.LatLng(d.optimal_prison.lat, d.optimal_prison.lng);
            var point = VMT.mapholder.map.latLngToLayerPoint(latlng);

            d.optimal_prison.x = point.x + d3.randomUniform(-0.01,0.01)();
            d.optimal_prison.y = point.y + d3.randomUniform(-0.01,0.01)();

  
        });



        var diagram = voronoi_fn.polygons(me.courts)



        function projectPoint(x, y) {
            // var point = VMT.mapholder.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(x, y);
        }

        var transform = d3.geoTransform({
                point: projectPoint
            })
        var path = d3.geoPath().projection(transform);


        var topology = computeTopology(voronoi_fn(me.courts));

        var multilinestring =  topojson.mesh(topology, topology.objects.voronoi,
                 function(a, b) { return a.data.optimal_prison.dest_prison !==  b.data.optimal_prison.dest_prison });

        me.voronoi_borders_layer
          .selectAll(".voronoi_borders").remove()

        me.voronoi_borders_layer
          .selectAll(".voronoi_borders")
          .data([multilinestring])
          .enter()
          .append("path")
          .attr("class", "voronoi_borders")
          .attr("d", path)


        function path_generator(d) {
            return d ? "M" + d.join("L") + "Z" : null
        }

    
        var v_cells = me.voronoi_cells_layer.selectAll(".voronoicells")
            .data(diagram)

        var cell_opacity = $("#cell_opacity_input").val()

        var prison_domains = _.map(VMT.dataholder.prison_locations, function(d) {
            return d.dest_prison
        })

        var cell_colour_scale = d3.scaleOrdinal().domain(prison_domains).range(VMT.categorical_colours)

        v_cells.enter().append("path").merge(v_cells)
            .attr("class", "voronoicells")
            .attr("d", function(d) {
                return path_generator(d)
            })
            .attr("fill", function(d) {
                return "black"
            })
            .style("fill-opacity", cell_opacity)
            .on("mouseover", me.court_on_mouseover)
 

        draw_loss()

        var circles = me.demand_points_layer.selectAll(".locations_circles")
            .data(diagram)

        // Scale for circle radius
        var max = _.max(me.courts, function(d) { return d.demand})["demand"]
        var min = _.min(me.courts, function(d) {return d.demand})["demand"]

        if (min==max) {min = max-1}
        var facility_size_scale = d3.scaleLinear().domain([0,max]).range([5,15])
        var facility_colour_scale = d3.scaleLinear().domain([min,max]).range(["#00AA14","#FF1511"])

        circles = circles.enter().append("circle")
            .attr("class", "locations_circles")
            .merge(circles)
            .attr("r", function(d) {
                return 3
            })
            .attr("cx", function(d) {
                return d.data.x
            })
            .attr("cy", function(d) {
                return d.data.y
            })
            .style("stroke", "black")
            .style("stroke-width", 0)
            .attr("fill", function(d) {return facility_colour_scale(d.data.demand)})
            .attr("class", "locations_circles")


    }

    function draw_loss() {

        //If there are no active prisons return 

        if (me.courts.length ==0) {return null};

        var filtered_prisons = _.filter(VMT.dataholder.prison_locations, function(d) {
            return d.activated
        })

        if (filtered_prisons.length == 0) {return null}



        //For each prison compute demand

        // Get min and max distance
        var assigned_courts = _.filter(VMT.dataholder.court_locations, function(d) {
            return (d.optimal_prison.dest_prison != "Unassigned")
        })

        var min_loss = _.min(assigned_courts, function(d) {
            return d.optimal_prison.duration_loss
        }).optimal_prison.duration_loss
        var max_loss = _.max(assigned_courts, function(d) {
            return d.optimal_prison.duration_loss
        }).optimal_prison.duration_loss

        var mid = (min_loss + max_loss) / 2

        var k = $("#input_line_thickness").val()/30

        var loss_line_colour_scale = d3.scaleLinear().domain([min_loss, mid, max_loss]).range(["#10FF00", "#FFAE00", "#FF0004"])
        var loss_line_width_scale = d3.scaleLinear().domain([min_loss, mid, max_loss]).range([0.5*k, 5*k, 10*k])
        var loss_line_opacity_scale = d3.scaleLinear().domain([min_loss, mid, max_loss]).range([1, 1, 1])
      
         me.demand_lines_layer.selectAll(".demand_data_lines").remove()
         me.demand_lines_layer.selectAll(".demand_data_lines").data(me.courts)
            .enter()
            .append("line")
            .attr("x1", function(d) {
                return d.x
            })
            .attr("y1", function(d) {
                return d.y
            })
            .attr("x2", function(d) {
                return d.optimal_prison.x
            })
            .attr("y2", function(d) {
                return d.optimal_prison.y
            })
            .style("stroke", function(d) {
                return loss_line_colour_scale(d.optimal_prison.duration_loss)
            })
            .style("stroke-width", function(d) {
                return loss_line_width_scale(d.optimal_prison.duration_loss)
            })
            .style("stroke-opacity", function(d) {
                return loss_line_opacity_scale(d.optimal_prison.duration_loss)
            })
            .attr("class", "demand_data_lines")
            .attr("pointer-events", "none")

        //Want to normalise demand against 85000 prison population and compute 'per prison' demand

       

    }

    function compute_loss(this_court) {



        var total_loss = 0
        var prison_stats = {}
        
        _.each(VMT.dataholder.court_locations, function(d) {
            total_loss += d.demand * d.optimal_prison.cost_variable

            if (!(d.optimal_prison.dest_prison in prison_stats)) {
                prison_stats[d.optimal_prison.dest_prison] = {}
                prison_stats[d.optimal_prison.dest_prison]["this_prison_total_loss"] = 0
                prison_stats[d.optimal_prison.dest_prison]["this_prison_total_demand"] = 0
            }

            prison_stats[d.optimal_prison.dest_prison]["this_prison_total_loss"] += d.demand*d.optimal_prison.cost_variable
            prison_stats[d.optimal_prison.dest_prison]["this_prison_total_demand"] += d.demand

            
        })

        prison_stats_list = []
         _.each(prison_stats, function(k,v) {
            k["dest_prison"] = v
            prison_stats_list.push(k) 
        })
 

        return {
            total_loss: total_loss,
            prison_stats: prison_stats_list
        }

    }



    this.draw_from_scratch()

    VMT.mapholder.map.on('viewreset moveend', this.draw_from_scratch);





    





}





function computeTopology(diagram) {
  var cells = diagram.cells,
      arcs = [],
      arcIndex = -1,
      arcIndexByEdge = {};

  return {
    objects: {
      voronoi: {
        type: "GeometryCollection",
        geometries: cells.map(function(cell) {
          var cell,
              site = cell.site,
              halfedges = cell.halfedges,
              cellArcs = [],
              clipArc;

          halfedges.forEach(function(halfedge) {
            var edge = diagram.edges[halfedge];
            if (edge.right) {
              var l = edge.left.index,
                  r = edge.right.index,
                  k = l + "," + r,
                  i = arcIndexByEdge[k];
              if (i == null) arcs[i = arcIndexByEdge[k] = ++arcIndex] = edge;
              cellArcs.push(site === edge.left ? i : ~i);
              clipArc = null;
            } else if (clipArc) { // Coalesce border edges.
              if (edge.left) edge = edge.slice(); // Copy-on-write.
              clipArc.push(edge[1]);
            } else {
              arcs[++arcIndex] = clipArc = edge;
              cellArcs.push(arcIndex);
            }
          });

          // Ensure the last point in the polygon is identical to the first point.
          var firstArcIndex = cellArcs[0],
              lastArcIndex = cellArcs[cellArcs.length - 1],
              firstArc = arcs[firstArcIndex < 0 ? ~firstArcIndex : firstArcIndex],
              lastArc = arcs[lastArcIndex < 0 ? ~lastArcIndex : lastArcIndex];
          lastArc[lastArcIndex < 0 ? 0 : lastArc.length - 1] = firstArc[firstArcIndex < 0 ? firstArc.length - 1 : 0].slice();

          return {
            type: "Polygon",
            data: site.data,
            arcs: [cellArcs]
          };
        })
      }
    },
    arcs: arcs
  };
}