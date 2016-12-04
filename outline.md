## namespace.js
Establishes the main namespace for the app, which is `VMT = {}`

This will be separated out into three elements:

- `dataholder`, which stores the raw data
- `model`, which stores 
- `view`, which stores elements related to the visualisation
- `settings`, which stores global settings

## main.js

Loads csv data and topojson via ajax

##  process_csv.js

Contains utility functions for processing csv files

## dataholder.js

Contains a dataholder class. 

- Starts by processing csv data into an array called `all_csv_data`.  
- Generates meta data for this data, such as minimum and maximum for each var etc `VMT.column_descriptions_data`



Javascript passes objects around by reference.  That means that if we create a single object to represent each demand source and supply source, and from then on just pass them around, there is a single 'definitive' copy of each.


Each supply is represented by a single object.  It has the following properties:

Each demand is represented by a single object.  It has the following properties:



However these supply and demand units are then referenced by a number of data structure to make finding them easier:


Need a way of holding supply and demand data.

A way of looking up the `VMT.cost_variable` for each `demand_id`


However, we store this object in a number of places

Supply just contains information about how much supply is currently assigned.

A list of `supply_id`.  For each, we need to know its total supply, and where the supply is currently allocated.

A list of `demand_id`s.  For each, we need to know its total demand, and where the demand is currently allocated.

For each supply, 
- 
need a list of demand in order of loss
For each demand, need a list of supply in order of loss



Function:  Parse geo data.





Object for demand point
Object for supply point
