// Notes:
// We want to allocate demand to supply, not vice veras

// But note that a single demand_source can be allocated to multiple supply_sources
// Because partial allocation is possible
function deep_copy_object(obj) {
   new_object = $.extend(true, {}, obj);
   return new_object
}


function Supply(row) {

	var me = this 

	this.reset_allocations = function() {
    	this.allocations = {}	//Populated in form of {demand_id:allocation}
    }

    //Returns size of allocation
    this.attempt_allocation = function(demand_object) {

    	//If there's space, make an allocation of demand to supply
    	if (me.is_full) {
    		return 0
    	}
    	
    	else if (me.supply_unallocated >= demand_object.demand_unallocated) {  //Supply exceeds demand
    		allocation_size = demand_object.demand_unallocated
    	}
    	else { //Demand exceeds supply
    		allocation_size = me.supply_unallocated
    	}
    	allocation = new Allocation(demand_object, me, allocation_size)
    	
    	//Register allocation to both supply and demand objects
    	me.allocations[demand_object.demand_id] = allocation
    	demand_object.allocations[me.supply_id] = allocation

    	return allocation_size 
    }

    this.unallocate = function(demand_id) {

    	//Need to remove allocation and increase supply and demand 

    }



    //Initialisation code:
	var supply_cols = ["supply","supply_id","supply_lat","supply_lng","supply_name"]
	var new_row = deep_copy_object(row)
	_.each(supply_cols, function(c) {
		me[c] = new_row[c]
	})

	this.reset_allocations()


}

Supply.prototype = {

    get supply_allocated() {
        reduce_sum = function(a,b) {
        	return a + b.allocation_size}
        return _.reduce(this.allocations, reduce_sum,0)
    },

    get supply_unallocated() {
    	return this.supply - this.supply_allocated

    },

    get is_full() {
    	if (this.supply_unallocated <=0) {
    		return true
    	} else {
    		return false
    	}
    }

}


function Demand(row) {

	var me = this 

	this.reset_allocations = function() {
    	this.allocations = {}	//Populated in form of {supply_id:allocation}
    }

	 //Initialisation code:
	var demand_cols = ["demand","demand_id","demand_lat","demand_lng","demand_name"]
	var new_row = deep_copy_object(row)
	_.each(demand_cols, function(c) {
		me[c] = new_row[c]
	})

	this.reset_allocations()

}

Demand.prototype = {

    get demand_allocated() {
        reduce_sum = function(a,b) {return a.allocation_size + b.allocation_size}
        return _.reduce(this.allocations, reduce_sum,0)
    },

    get demand_unallocated() {
    	return this.demand - this.demand_allocated

    },

    get is_full() {
    	if (this.demand_unallocated <=0) {
    		return true
    	} else {
    		return false
    	}
    }

}

function Allocation(demand_object, supply_object, allocation_size) {
	this.demand_object = demand_object
	this.supply_object = supply_object
	this.allocation_size = allocation_size
}

row = {
  "demand": 11.6620191555,
  "demand_id": "0",
  "demand_lat": 50.9201278763,
  "demand_lng": -2.67073887071,
  "demand_name": "Green Ln",
  "supply": 35.6895004806,
  "supply_id": 0,
  "supply_lat": 51.7493139942,
  "supply_lng": -0.240862847712,
  "supply_name": "Roehyde Way",
  "duration_min": 158.883333333,
  "distance_crowflies_km": 192.761854658,
  "distance_route_km": 235.458
}

s = new Supply(row)
d = new Demand(row)

console.log("---Before allocation---")


console.log(`s.is_full is: ${s.is_full}`)
console.log(`s.supply_unallocated is: ${s.supply_unallocated}`)
console.log(`s.supply_allocated is: ${s.supply_allocated}`)

s.attempt_allocation(d)
console.log("---After allocation---")
console.log(`s.is_full is: ${s.is_full}`)
console.log(`s.supply_unallocated is: ${s.supply_unallocated}`)
console.log(`s.supply_allocated is: ${s.supply_allocated}`)
