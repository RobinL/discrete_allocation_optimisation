var p1 = $.ajax(VMT.settings.shapefile_path)
var p2 = $.ajax(VMT.settings.csv_path)

// To use on shared drives, comment out the above two lines, and uncomment the following:
// var p3 = jQuery.Deferred();
// p3.resolve("hurray")
// $.when(p3).done(function() { topo_data = [topo_data]

function parse_topojson(topo_data) {

    //Convert topo_json to geojson
    var geo_collection = topo_data[0]
    var geo_collection = topojson.feature(geo_collection, geo_collection.objects.subunits)

    //England, Wales
    geo_collection.features = [geo_collection.features[0], geo_collection.features[4]]
    return geo_collection

}

function process_csv_data(csv_data) {

    //Parse the csv data  (remove this line if you've converted data to a .js to serve from shared drive)
    var csv_data = d3.csvParse(csv_data)

    //Add the csv data to the data manager 
    VMT.dataholder = new DataHolder(csv_data)

    VMT.dataholder.create_court_locations()
    VMT.dataholder.create_prison_locations()

    var prison_keys = _.keys(VMT.dataholder.prison_locations_dict)
    // VMT.dataholder.prison_locations_dict[prison_keys[0]].activated = true
    VMT.dataholder.prison_locations_dict[prison_keys[1]].activated = true
    VMT.dataholder.prison_locations_dict[prison_keys[9]].activated = true
    VMT.dataholder.prison_locations_dict[prison_keys[13]].activated = true
    
    VMT.dataholder.create_voronoi_dataset()


}

$.when(p1, p2).done(function(ajax_topo_data, ajax_csv_data) {

    VMT.mapholder = new MapHolder()
    VMT.geo_collection = parse_topojson(ajax_topo_data)

    process_csv_data(ajax_csv_data[0])

    //Draw options


    draw_options("#prison_capacity_options", _.map(VMT.dataholder.prison_locations_dict, 
                function(v,k) {
                    return {"value":v.dest_prison, "text":v.dest_prison}}
                ))


    var cap_options = _.map(VMT.dataholder.prison_locations_dict,
                function(v,k) {
                    return {"value":v.dest_prison, "text":v.dest_prison}}
                )

    cap_options.push({"value":"change_all", "text":"Change all prison capacities"})

    draw_options("#prison_capacity_options", cap_options)


    $("#prison_capacity_options").on("change", function(d) {

        //Update the value to be the one from the dict
        var this_prison = $("#prison_capacity_options").val()

        if (this_prison == "change_all") {$("#prison_capacity_value").val("")}

            else {

        var current_capacity = VMT.dataholder.prison_locations_dict[this_prison].prison_capacity

        // Update the capacity dictionary, and update the data, then redraw
        $("#prison_capacity_value").val(current_capacity)
    }

    })

    $("#prison_capacity_options").change()

    $("#prison_capacity_value").on("change", function(d) {

        // Figure out which prison we're changing.
        var this_prison = $("#prison_capacity_options").val()

        // Update the capacity dictionary, and update the data, then redraw
        var new_capacity_value = $("#prison_capacity_value").val()

        if (this_prison == "change_all") {
            _.each(VMT.dataholder.prison_locations_dict, function(this_prison){
                this_prison.prison_capacity = parseFloat(new_capacity_value)
            })

        } else {
        VMT.dataholder.prison_locations_dict[this_prison].prison_capacity = parseFloat(new_capacity_value)
        }

        VMT.voronoi_map.draw_from_scratch()
        VMT.pointsmap.draw_from_scratch()

        $("#hover_panel").html("Hover over court to display info")


    })
    $("#num_iterations_1, #num_iterations_1").on("change", function(d) {
        VMT.voronoi_map.draw_from_scratch()
        VMT.pointsmap.draw_from_scratch()
    })

    //Draw options for estates
    var estate_options = _.unique(VMT.estate_options, function(d) {
        return d.option
    })

    var estate_options = _.map(estate_options, function(d) {
        return {"text": d.option, "value": d.value}
    })

    draw_options("#prison_estate_options", estate_options)


    draw_options("#data_csv_select", VMT.csv_files )

    $("#prison_estate_options").on("change", function(d) {
        var this_option_text = $("#prison_estate_options").val()

        //Turn off all prisons, and change capacity to zero

        _.each(VMT.dataholder.prison_locations_dict, function(this_prison) {
            this_prison.activated = false
            this_prison.prison_capacity = 0
        })

        //Then iterate, turning back on according to option
        _.each(VMT.estate_options, function(this_option) {
            if (this_option.option == this_option_text) {
                VMT.dataholder.prison_locations_dict[this_option.prison].activated = true
                VMT.dataholder.prison_locations_dict[this_option.prison].prison_capacity = this_option.size

            }
         
        })

           VMT.voronoi_map.draw_from_scratch()
        VMT.pointsmap.draw_from_scratch()
    })

    $("#data_csv_select").on("change", function(d) {
        new_csv_and_redraw($("#data_csv_select").val())
    })

    $("#filter_records_date_field").on("change", function(d) {
        VMT.pointsmap.draw_from_scratch()

    })

    $("#shadingOptions,  #pointShadingOptions").on("change", function(d) {
        $("#keyOptions").val(this.value)
        VMT.pointsmap.style_overlay()
    })

    $("#colourOptions, #keyOptions, #pointSizeOptions").on("change", function(d) {

        VMT.pointsmap.style_overlay()

    })



    $("#toggle_basemap").on("click", function(d) {
        if (VMT.mapholder.tiles_visible) {
            VMT.mapholder.map.removeLayer(VMT.mapholder.tilelayer)
            VMT.mapholder.tiles_visible = false
        } else {
            VMT.mapholder.map.addLayer(VMT.mapholder.tilelayer)
            VMT.mapholder.tiles_visible = true
        }
    })

    $("#input_point_size, #input_line_thickness, #cell_opacity_input").on("change", function(d) {
        VMT.voronoi_map.draw_from_scratch()
        VMT.pointsmap.draw_from_scratch()

    })




    //Finally draw map
    VMT.pointsmap = new PointsMap();
    VMT.voronoi_map = new VoronoiMap()



});


function new_csv_and_redraw(csv_path) {
    VMT.csv_path = csv_path
    var p1 = $.ajax(VMT.csv_path)

    $.when(p1).done(function(csv_data) {

        var csv_data = d3.csvParse(csv_data)

        //Add the csv data to the data manager 
        VMT.dataholder = new DataHolder(csv_data)
        VMT.dataholder.process_column_descriptions()
        VMT.dataholder.parse_columns()
        VMT.dataholder.create_court_locations()
        VMT.dataholder.create_prison_locations()

        var prison_keys = _.keys(VMT.dataholder.prison_locations_dict)
        VMT.dataholder.prison_locations_dict[prison_keys[0]].activated = true
        VMT.dataholder.prison_locations_dict[prison_keys[1]].activated = true

        VMT.mapholder.reset_all_layers()
        VMT.dataholder.create_voronoi_dataset()

        VMT.pointsmap = new PointsMap();
        VMT.voronoi_map = new VoronoiMap()

        // Finally want to redraw the prison options

        d3.select("#prison_capacity_options").selectAll("option").remove()
        
        draw_options("#prison_capacity_options", _.map(VMT.dataholder.prison_locations_dict, 
                function(v,k) {
                    return {"value":v.dest_prison, "text":v.dest_prison}}
                ))


        $("#prison_capacity_options").on("change", function(d) {

            //Update the value to be the one from the dict
            var this_prison = $("#prison_capacity_options").val()
            var current_capacity = VMT.dataholder.prison_locations_dict[this_prison].prison_capacity

            // Update the capacity dictionary, and update the data, then redraw
            $("#prison_capacity_value").val(current_capacity)

        })

        $("#prison_capacity_options").change()


        })



}

function getListOfOptions(){

    var fields = _.filter(VMT.column_descriptions_data, function(d) {
        return d["manually_included"]
    })

    var list = _.map(fields, function(d) {
        return d.key
    })

    return list
}

function metrics_to_options_data(metrics) {
    return _.map(metrics, function(d) {
        return {
            "value": d,
            "text": VMT.column_descriptions_data[d].long_name
        }
    })
}

function colour_options_to_options_data() {
    return _.map(VMT.colour_options, function(k, v) {
        return {
            "value": v,
            "text": v
        }
    })
}

function period_to_options_data() {

    var format = VMT.column_descriptions_data[VMT.filter_field].format
    var uniques = _.unique(VMT.dataholder.all_csv_data, function(d) {

        return format(d[VMT.filter_field]);
    })

    var uniques = _.map(uniques, function(d) {
        return d[VMT.filter_field];
    })

    uniques = uniques.sort(function(a, b) {
        return a.getTime() - b.getTime()
    })

    var return_array = _.map(uniques, function(d) {
        return {
            "text": format(d),
            "value": format(d)
        }
    })

    VMT.period_options = _.map(uniques, format);

    return return_array

}






