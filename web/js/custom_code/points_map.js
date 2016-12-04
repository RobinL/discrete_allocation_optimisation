function PointsMap() {

    //When the data changes we just need to redraw the overlay
    //This function styles the points and the shaded area
    this.style_overlay = function() {

        if (!(VMT.global_key_scale)) {
            VMT.dataholder.set_domains("current")
            VMT.dataholder.update_colour_scales()
        }

        var facility_locations_sel = d3.selectAll(".facility_locations")

        var va = facility_locations_sel
            .data(VMT.dataholder.prison_locations)

        va
            .attr("cy", function(d) {
                return d.y
            })
            .attr("cx", function(d) {
                return d.x
            })
            .style('fill', function(d) {
                if (d.activated) {
                    return "red"
                } else {
                    return "grey"
                }
            })
            .attr("r", function(d) {
                return 10
            })
            .attr("fill-opacity", function(d) {
                return 1
            })
            .attr("stroke", "black")


        d3.select('#map_key').remove();
        // draw_map_key_continuous()


    }



    function facilities_on_click(d) {
        // If we click the facility, we want to toggle activation and redraw

        var filtered_prisons = _.filter(VMT.dataholder.prison_locations, function(d) {
            return d.activated
        })


        _.each(VMT.dataholder.prison_locations,function(d2) {
            if (d.dest_prison == d2.dest_prison) {
                d2.activated = !d2.activated
            }

            me.style_overlay()
        
        })

        VMT.voronoi_map.draw_from_scratch()


        if (filtered_prisons.length>0) {
            VMT.voronoi_map.court_on_mouseover(VMT.voronoi_map.previous_hover_court)
        }
    }


    //Remove overlay and redraw
    this.draw_from_scratch = function() {


        VMT.mapholder.redraw()

        //Get layer 
        g = d3.select("#facility_location_layer")

        //Use leaflet's internal functions to convert the 
        //points' lat lng into x y values corresponding to the leaflet map
        VMT.dataholder.prison_locations = VMT.dataholder.prison_locations.map(function(d) {

            var latlng = new L.LatLng(d.lat, d.lng);
            var point = VMT.mapholder.map.latLngToLayerPoint(latlng);

            d.x = point.x;
            d.y = point.y;

            return d

        });

        //Now our 'current points' contain all the information we need to draw the voronoi map
        //For each filtered point, covert the lat lng into x y point in svg space
        var facility_locations_sel = g.selectAll(".facility_locations")
            .data(VMT.dataholder.prison_locations)
            .enter()


        facility_locations_sel.append("circle")
            .attr("class", "facility_locations")
            .on("click", facilities_on_click)



        me.style_overlay()


    }

    var me = this;

    var geo_collection = geo_collection;

    VMT.mapholder.map.on('viewreset moveend', this.draw_from_scratch);

    this.draw_from_scratch()



}