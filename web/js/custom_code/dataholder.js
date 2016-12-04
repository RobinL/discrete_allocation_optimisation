

function DataHolder(csv_data) {



    /**
     * Iterate through the csv data creating a demand object for each unique area of demand
     */
    this.create_demand_suppy_objects = function() {

 
        var demand_cols = ["demand","demand_id","demand_lat","demand_lng","demand_name"]
        var supply_cols = ["supply","supply_id","supply_lat","supply_lng","supply_name"]


        //Then to each demand item, connect a supply item, and row-level data
        function copy_row_subset_cols(row, cols) {
            
            row = deep_copy_object(row)
            var return_obj = {}
            _.each(cols, function(c) {
                return_obj[c] = row[c]
            })
            return return_obj

        }
        
        _.each(this.all_csv_data, function(csv_row) {

            if (!(csv_row.supply_id in me.supply_sources_dict)) {
                var supply_source = copy_row_subset_cols(csv_row, supply_cols)
                me.supply_sources_dict[csv_row.supply_id] = supply_source
            }

            if (!(csv_row.demand_id in me.demand_sources_dict)) {
                var demand_source = copy_row_subset_cols(csv_row, demand_cols)
                me.demand_sources_dict[csv_row.demand_id ] = demand_source
            }


        })

    }

    this.reset_demand_supply_obects = function() {

        _.each(me.supply_sources_dict, function(v,k) {
            v["supply_allocated"] = 0
            v["supply_allocations"] = [] //In form [{"demand_id" : , "supply_allocated" :}]
        })

        _.each(me.demand_sources_dict, function(v,k) {
            v["demand_allocated"] = 0
        })

    }

        //From now on me.supply_sources_dict and me.demand_sources_dict are the definitive data source on the 
        //sources of supply and demand.  We reference them, but do not copy them.







    //     _.each(this.all_csv_data, function(csv_row) {

           
    //         me.court_sources_dict[csv_row.source_court]["lat"] = csv_row.source_lat
    //         me.court_sources_dict[csv_row.source_court]["lng"] = csv_row.source_lng
    //         me.court_sources_dict[csv_row.source_court]["demand"] = csv_row.demand
    //         me.court_sources_dict[csv_row.source_court]["source_postcode"] = csv_row.source_postcode
    //         me.court_sources_dict[csv_row.source_court]["source_court"] = csv_row.source_court

    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison] = {}
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["dest_prison"] = csv_row.dest_prison
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["lat"] = csv_row.dest_lat
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["lng"] = csv_row.dest_lng
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["postcode"] = csv_row.dest_postcode
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["distance"] = csv_row.distance
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["duration"] = csv_row.duration
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["prison_capacity"] = csv_row.prison_capacity
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["duration_loss"] = csv_row.duration * csv_row.demand
    //         me.court_sources_dict[csv_row.source_court]["all_prisons"][csv_row.dest_prison]["distance_loss"] = csv_row.distance * csv_row.demand

    //     })

    //     //For later computations we will need these in order of loss
    //     _.each(me.court_sources_dict, function(this_court){
    //         this_court.all_prisons_loss_ordered = _.sortBy(this_court.all_prisons, function(v,k) {
    //             return v[VMT.cost_variable]
    //         })
    //     })


    // }

    this.create_supply_objects = function () {

        // me.prison_capacity_dict = {}

        _.each(this.all_csv_data, function(csv_row) {
            if (!(csv_row.dest_prison in me.prison_sources_dict)) {
                me.prison_sources_dict[csv_row.dest_prison] = {}
                me.prison_sources_dict[csv_row.dest_prison].all_courts = {}
                me.prison_sources_dict[csv_row.dest_prison].activated = false
            }
        
            me.prison_sources_dict[csv_row.dest_prison]["lat"] = csv_row.dest_lat
            me.prison_sources_dict[csv_row.dest_prison]["lng"] = csv_row.dest_lng
            me.prison_sources_dict[csv_row.dest_prison]["postcode"] = csv_row.dest_postcode
            me.prison_sources_dict[csv_row.dest_prison]["prison_capacity"] = csv_row.prison_capacity
            me.prison_sources_dict[csv_row.dest_prison]["dest_prison"] = csv_row.dest_prison

            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court] = {}
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["source_court"] = csv_row.source_court
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["lat"] = csv_row.source_lat
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["lng"] = csv_row.source_lng
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["postcode"] = csv_row.source_postcode
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["demand"] = csv_row.demand
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["duration"] = csv_row.duration
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["distance"] = csv_row.distance
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["duration_loss"] = csv_row.duration * csv_row.demand
            me.prison_sources_dict[csv_row.dest_prison]["all_courts"][csv_row.source_court]["distance_loss"] = csv_row.distance * csv_row.demand

            // me.prison_capacity_dict[csv_row.dest_prison] = csv_row.prison_capacity
        })

        //For later computations we will need these in order of loss
        _.each(me.prison_sources_dict, function(this_prison){
            this_prison.all_courts_loss_ordered = _.sortBy(this_prison.all_courts, function(v,k) {
                return v[VMT.cost_variable]
            })
        })

        //Create one final 'null' prison, with name 'unassigned'
        var null_prison = $.extend(true, {}, me.prison_sources_dict[_.keys(me.prison_sources_dict)[0]]) 
        null_prison["dest_prison"] = "Unassigned"
        null_prison["activated"] = false
        null_prison["prison_capacity"] = 0
        me.prison_sources_dict["Unassigned"] = null_prison

    }

    this.create_voronoi_dataset = function() {

        var duration_thresholds =  VMT.duration_thresholds 

        //For each court location, assign a list of all prisons, and order by the 'closest'

        function reset_stats() {
            _.each(me.court_sources_dict, function(this_court) {

                this_court.active_prisons_loss_ordered = _.filter(this_court.all_prisons_loss_ordered ,function(this_prison) {
                    return me.prison_sources_dict[this_prison.dest_prison].activated
                })       

                //Has the demand from this court been assigned to a prison
                this_court.demand_remaining = this_court.demand

                this_court.optimal_prison = {}
                this_court.optimal_prison.lat = this_court.lat
                this_court.optimal_prison.lng = this_court.lng
                this_court.optimal_prison.dest_prison = "Unassigned"
                this_court.optimal_prison.loss = 99999999
                this_court.optimal_prison.duration_loss = 99999999
                this_court.optimal_prison.duration = 99999999
                this_court.optimal_prison.distance = 99999999

                this_court.demand_assigned_to_prisons = {}
                this_court.biggest_demand_assigned = 0

            })

            //For each prison, get a list of all courts, in various orders
             _.each(me.prison_sources_dict, function(this_prison) {

                this_prison.remaining_capacity = this_prison.prison_capacity
                this_prison.cumulative_demand = 0
                this_prison.cumulative_duration = 0
                this_prison.cumulative_distance = 0
                this_prison.count_of_allocated_courts = 0
                this_prison.total_catchment_closest = 0

                _.each(duration_thresholds, function(threshold) {
                    this_prison["demand_under_duration_"+threshold] = 0
                })


        
            })

        }

        //Now we have the information we need we can run the core algorithm
        function assign_courts_to_prisons() {
            //First figure out which courts are going to be assigned and an initial and naive order of assignment

            //Reset all the information about how demand is allocated (but retain information about the order which it was allocated)
            reset_stats()

            var this_ordering = []

            // Get active prisons
            var active_prisons = _.filter(me.prison_sources_dict, function(this_prison){
                return this_prison.activated
            })
            
            
            //First allocation and ordering:  if supply>demand, just map courts to closest prison


            counter = 0
            function first_assignment() {
                //To fix this properly:
                //Order by closeness to one of the active prisons (i.e. min(lossp1, lossp2 etc))
                //Assign using this ordering until one of the prisons get full
                //Reorder remaining by closeness to remainin prisons etc.

                //Each prison.  Assign courts to the prison by closeness until the prison is full.  Make one assignment per prison
                //and cycle.

                var order_counter = 0

                _.each(me.court_sources_dict, function(this_court) {
                    //Initial allocation order very high to make sure if it's unallocate it will go last later.
                    this_court.initial_allocation_order = 888888
                })

                // for i = 0 to the number of courts
                _.each(d3.range(_.keys(me.court_sources_dict).length), function(i) {

                    //For each active prison
                    _.each(active_prisons, function(this_prison) {

                        //If this prison is full then skip
                        // if (me.prison_sources_dict[this_prison.dest_prison].remaining_capacity < 0.001) {return}

                        //Get list of courts closest to this prison
                        var courts_list = this_prison.all_courts_loss_ordered

                        //For each court in order of distance
                        //TODO:  Keep track of whether this prison is full.
                        _.every(courts_list, function(this_court_no_detail) {
                            var this_court = me.court_sources_dict[this_court_no_detail.source_court]
                            
                            if (this_court.demand_remaining >0.001 & me.prison_sources_dict[this_prison.dest_prison].remaining_capacity >= this_court.demand_remaining){
                                
                                make_single_court_assignment(this_court)
                                this_court.initial_allocation_order = order_counter
                                order_counter+=1
                            
                                return false
                            } else {
                                return true
                            }

                        })
                        
                    })
                })


            }

            first_assignment()



            var this_ordering = _.sortBy(me.court_sources_dict, function(d) {

                return d.initial_allocation_order})

            _.each(me.court_sources_dict, function(this_court) {
                this_court.delta_best_loss_to_worst_allocation = 1
            })


            function make_single_court_assignment(this_court) {


                //If unallocated set stats
                _.each(this_court.active_prisons_loss_ordered, function(prison, order) {

                    var this_prison = me.prison_sources_dict[prison.dest_prison]

                    var prison_has_space = (this_prison.remaining_capacity > 0.001);
                    var court_has_demand = (this_court.demand_remaining > 0.001);

                    if (prison_has_space & court_has_demand){
                        if (this_prison.remaining_capacity > this_court.demand_remaining) {
                                var demand_to_assign = this_court.demand_remaining
                            } else {
                                var demand_to_assign = this_prison.remaining_capacity
                        }

                        this_prison.remaining_capacity  -= demand_to_assign
                        this_court.demand_remaining -= demand_to_assign
                        this_court.demand_assigned_to_prisons[this_prison.dest_prison] = demand_to_assign

                        if (this_court.biggest_demand_assigned < demand_to_assign) {
                            this_court.biggest_demand_assigned  = demand_to_assign
                            this_court.optimal_prison = $.extend(false, [], this_prison) 

                            var new_opt = me.court_sources_dict[this_court.source_court].all_prisons[this_prison.dest_prison]
                            this_court.optimal_prison = $.extend(false, {}, new_opt) 


                            //Best possible loss
                            var best_possible_loss = this_court.active_prisons_loss_ordered[0].duration
                            var assignment_loss = this_court.active_prisons_loss_ordered[order].duration

                            //DONT RESET THIS!  Only update it if the loss is even bigger - i.e. assignment order is by 'worst seen eventuality'
                            var this_loss = best_possible_loss - assignment_loss  

                            if (this_loss < this_court.delta_best_loss_to_worst_allocation) {
                                this_court.delta_best_loss_to_worst_allocation = best_possible_loss - assignment_loss 
                            }   

                        }

                    }



                    // me.court_sources_dict[this_court.source_court] = this_court

                })


            }
            

            // Now assign in that order
            function assign_based_on_current_ordering() {

                //Reset statistics
                reset_stats()
                
                _.each(this_ordering, function(d) {



                    try {
                    this_court = me.court_sources_dict[d.source_court]
                    } catch(err) {debugger;}

                    // Assign to closest prison, or next closest if full until all prisons are full
                    //If this court is on the list to be assigned, assign it


                    if (this_court.initial_allocation_order != 888888) {  //Only assign courts 
                        make_single_court_assignment(this_court)
                    }

                })

                a=1



            }

            function refresh_ordering() {
                this_ordering = _.map(me.court_sources_dict, function(d) {
                    return d
                })

                this_ordering = _.sortBy(this_ordering, function(d) {
                    return d.delta_best_loss_to_worst_allocation}
                )
            }

            function get_total_loss_from_current_allocation() {
                var total_loss = 0
                _.each(me.court_sources_dict, function(this_court) {
                    if (this_court.optimal_prison != "Unassigned") {
                        total_loss += this_court.demand * this_court.optimal_prison.duration
                    }
                })
                return total_loss
            }

            function getRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }


            for (var i = 0; i < $("#num_iterations_1").val(); i++) {
                assign_based_on_current_ordering()
                refresh_ordering()
            }


            //Finally try swopping courts with a neighbour which is assigned to a different prison and recomputing

            //TODO - SOME OF THESE SWAPS ARE UNBALANCED

            for (var i = 0; i <$("#num_iterations_2").val(); i++) {
                 _.each(me.court_sources_dict, function(this_court) {
                    // Iterate through other courts finding four closest courts.
                    //If they are assigned to a different prison (not 'Unassigned') attempt a swop and see whether it was better!

                    var closest_courts = _.sortBy(me.court_sources_dict, function(d) {
                        p1 = L.latLng(this_court.lat, this_court.lng)
                        p2 = L.latLng(d.lat, d.lng)
                        return p1.distanceTo(p2)

                    })
                    
                    // var closest_courts = closest_courts.slice(0,5)

                    var swap_best_gain = 0
                    var best_swap_court = null

                    _.each(closest_courts, function(close_court) {


                        //attempt swop. But only execute best swop
                        var b1 = (close_court.optimal_prison.dest_prison != "Unassigned")
                        var b2 = (this_court.optimal_prison.dest_prison != "Unassigned")
                        var b3 = (close_court.source_court != this_court.source_court)
                        var b4 = (close_court.optimal_prison.dest_prison != this_court.optimal_prison.dest_prison)


                        if (b1 & b2 & b3 & b4) {

                            //look up cost of this_court being assigned to close_court's prison and vice versa.  If better make switch
                            var current_loss = this_court.optimal_prison.duration + close_court.optimal_prison.duration

                            var this_court_dest_prison = this_court.optimal_prison.dest_prison
                            var close_court_dest_prison = close_court.optimal_prison.dest_prison

                            var loss1 = me.prison_sources_dict[this_court_dest_prison].all_courts[close_court.source_court].duration
                            
                            var loss2 = me.prison_sources_dict[close_court_dest_prison].all_courts[this_court.source_court].duration
                            
                            var new_loss = loss1 + loss2


                            if (current_loss - new_loss > swap_best_gain) {
                                swap_best_gain = current_loss - new_loss
                                swap_best_court = $.extend(false, {}, close_court)
                            }
                           


                        } 


                       
                    })

                     if (swap_best_gain>0) {

                                var new_p1 = me.court_sources_dict[this_court.source_court].all_prisons[swap_best_court.optimal_prison.dest_prison]
                                var new_p2 = me.court_sources_dict[swap_best_court.source_court].all_prisons[this_court.optimal_prison.dest_prison]

                                me.court_sources_dict[this_court.source_court].optimal_prison = $.extend(false, {}, new_p1) 
                                me.court_sources_dict[swap_best_court.source_court].optimal_prison = $.extend(false, {}, new_p2) 

                        } 


                })
            }


            // log to console total demands
            var temp_p_dict = {}
            _.each(me.court_sources_dict, function(d) {
                temp_p_dict[d.optimal_prison.dest_prison] = 0
            })
            _.each(me.court_sources_dict, function(d) {
                temp_p_dict[d.optimal_prison.dest_prison] += d.demand
            })

            console.log(temp_p_dict)

 
           
    
           


        }


        var active_prisons = _.filter(me.prison_sources_dict, function(this_prison){
            return this_prison.activated
        })





        //Order of assignment will keep track of the last order we assigned courts in, and a 'relative loss'
        //We will iterate the assignment process, adjusting this ordering each time.

        assign_courts_to_prisons()

        //  Compute averages for prisons
        _.each(me.court_sources_dict, function(this_court) {
            var dest_prison = this_court.optimal_prison.dest_prison
            me.prison_sources_dict[dest_prison].cumulative_demand += this_court.demand

            var this_prison = this_court.all_prisons[dest_prison]
            me.prison_sources_dict[dest_prison].cumulative_distance += this_court.optimal_prison.distance*this_court.demand
            me.prison_sources_dict[dest_prison].cumulative_duration += this_court.optimal_prison.duration*this_court.demand
            me.prison_sources_dict[dest_prison].count_of_allocated_courts +=1

            var closest_prison = this_court.all_prisons_loss_ordered[0]["dest_prison"]

            var closest_prison = _.filter(this_court.all_prisons_loss_ordered, function(this_prison) {
                return me.prison_sources_dict[this_prison.dest_prison].activated
            })[0]["dest_prison"]

            me.prison_sources_dict[closest_prison].total_catchment_closest +=this_court.demand

            //For prison, compute to thresholds
            _.each(duration_thresholds, function(threshold) {
                    if (this_court.optimal_prison.duration <= threshold) {
                        me.prison_sources_dict[dest_prison]["demand_under_duration_"+threshold] += this_court.demand
                    }
                })

            _.each(duration_thresholds, function(threshold) {
                me.prison_sources_dict[dest_prison]["perc_demand_under_duration_"+threshold] = me.prison_sources_dict[dest_prison]["demand_under_duration_"+threshold]/me.prison_sources_dict[dest_prison].cumulative_demand
            })

        })


        // Finally convert the dicts to lists for d3
        me.court_sources = _.map(me.court_sources_dict, function(v,k) {return v})
        me.prison_sources = _.map(me.prison_sources_dict, function(v,k) {return v})
        me.prison_sources = _.filter(me.prison_sources, function(this_prison) {
            return !(this_prison.dest_prison == "Unassigned")
        })


        me.total_loss = {count_allocated_courts: 0,
                        count_unallocated_courts: 0,
                        total_duration:0,
                        demand_allocated: 0,
                        demand_unallocated: 0
                        }

        _.each(duration_thresholds, function(d) {
            me.total_loss["demand_under_duration_"+d] = 0
        })

        var active_prisons = _.filter(me.prison_sources_dict, function(this_prison){
                return this_prison.activated
            })

        me.total_loss.number_of_active_prisons = active_prisons.length;




        _.each(me.court_sources, function(this_court) {

            if (this_court.optimal_prison.dest_prison == "Unassigned") {
                me.total_loss.count_unallocated_courts += 1

                //TODO what about partial?
                me.total_loss.demand_unallocated += this_court.demand

            }
            else {
                me.total_loss.count_allocated_courts +=1
                me.total_loss.demand_allocated += this_court.demand
                me.total_loss.total_duration += this_court.demand * this_court.optimal_prison.duration

                _.each(duration_thresholds, function(threshold) {
                    if (this_court.optimal_prison.duration <= threshold) {
                        me.total_loss["demand_under_duration_"+threshold] += this_court.demand
                    }
                })
            }

        })

        // Also want to compute statistics like % of demand within x duration
        _.each(duration_thresholds, function(threshold) {
            me.total_loss["perc_demand_under_duration_"+threshold] = me.total_loss["demand_under_duration_"+threshold]/me.total_loss.demand_allocated
        })

        me.total_loss.overall_average_duration = me.total_loss.total_duration/me.total_loss.demand_allocated

    }

    this.set_domains = function(data_type) {



        if (data_type == "all") {
            var all_csv_data = this.all_csv_data
        } else {
            var all_csv_data = this.demand_points
        }
        _.each(this.column_descriptions_data, function(d1, k1) {

            // For each columns, set the domain

            // If categorical, get uniques

            if (d1["is_categorical"]) {

                var uniques = _.uniq(all_csv_data, function(item, key) {
                    a = item[k1]
                    return item[k1]
                })

                uniques = _.map(uniques, function(d) {
                    return d[k1]
                })

                if (!(d1["domain_manually_set"])) {
                    d1["domain"] = uniques
                }
                d1["colour_scale"] = d3.scaleOrdinal().domain(d1["domain"]).range(VMT.categorical_colours)
            }

            // If numeric, get min max

            if (!(d1["is_categorical"])) {

                var all_values = _.map(all_csv_data, function(d) {
                    return d[k1]
                });

                var all_values = _.filter(all_values, function(d) {
                    return !(isNaN(d))
                })

                var minMetric = Math.min.apply(null, all_values);
                var maxMetric = Math.max.apply(null, all_values);

                // Need to split min to max depending on how many items in colour scale

                // get colour scale 

                var c_options = VMT.colour_options[d1["colour_option"]]

                var num_colours = c_options.length
                var diff = maxMetric - minMetric

                domain = d3.range(minMetric, maxMetric + diff / 100, diff / (c_options.length - 1))

                if (!(d1["domain_manually_set"])) {
                    d1["domain"] = domain
                }

                d1["colour_scale"] = d3.scaleLinear()
                    .domain(d1["domain"])
                    .range(c_options);

                d1["minmax"] = [minMetric, maxMetric]

            }


        })
    }

    this.update_colour_scales = function() {

        var colourScaleOption = "Double condensed"
        var colour_scale = VMT.colour_options[colourScaleOption]

        // Iterate through the column_descriptions_data updating the colour scale

        _.each(this.column_descriptions_data, function(d, k) {

            if (d["colour_option_manually_set"] == false) {

                if (!(d["is_categorical"])) {

                    var min_ = d["minmax"][0];
                    var max_ = d["minmax"][1];

                    var diff = max_ - min_;
                    var domain = d3.range(min_, max_ + diff / 100, diff / (colour_scale.length - 1));

                    if (!(d["domain_manually_set"])) {
                        d["domain"] = domain
                    }

                    d["colour_scale"] = d3.scaleLinear().domain(d["domain"]).range(colour_scale)
                }
            }


        })

    }

    this.get_timeseries_data = function(this_geography_id) {

        return _.filter(this.all_csv_data, function(d) {

            return d["geography_id"] == this_geography_id
        })

    }

    //  Get rid of rows which don't have lat lng
    this.filter_out_invalid_coordinates = function() {
        this.all_csv_data = _.filter(this.all_csv_data, function(d) {
            if (isNaN(d["lat"])) {
                return false
            }
            if (isNaN(d["lng"])) {
                return false
            }
            return true
        })
    }

    var me = this
    
    //Copy data
    this.all_csv_data = csv_data.slice();

    //These datastructures 
    this.supply_sources_dict = {}
    this.demand_sources_dict = {}
    
    this.supply_sources = []
    this.demand_sources = []
    
    this.active_prisons = []

    var cdd_copy = deep_copy_object(VMT.settings.column_descriptions_overrides);

    this.column_descriptions_data = process_csv.process_column_descriptions(cdd_copy, this.all_csv_data, VMT.settings)
    this.all_csv_data = process_csv.parse_columns(this.all_csv_data,this.column_descriptions_data )

    this.create_demand_suppy_objects()
    this.reset_demand_supply_obects()
    debugger;

};