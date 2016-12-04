var process_csv = {}



process_csv.process_column_descriptions = function(manual_overrides,csv_data, settings) {

        var representative_row = csv_data[0]

        var column_descriptions_data = manual_overrides

        // Add any keys which are in the data but aren't in column_descriptions_data
        _.each(representative_row, function(d, k) {
            if (!(_.has(column_descriptions_data, k))) {
                column_descriptions_data[k] = {
                    "manually_included": false
                }
            } else {

                if (!(_.has(column_descriptions_data[k], "manually_included"))) {
                    column_descriptions_data[k]["manually_included"] = true
                }
            }

        })

        // If they don't have a long name, overwrite with the key
        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "long_name"))) {
                d["long_name"] = k
            }
        });

        // Set default colour option to first in the list unless manually specified
        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "colour_option"))) {
                d["colour_option"] = _.keys(settings.colour_options)[0]
                d["colour_option_manually_set"] = false
            } else {
                d["colour_option_manually_set"] = true
            }
        })

        // Hold the key in the dict for easy access later
        _.each(column_descriptions_data, function(d, k) {
            d["key"] = k
        })


        // Detect whether variables are categorical or continuous
        // Iterate through the columns which will be part of this vis


        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "is_categorical"))) {
                // Look through data - if we can parsefloat every value then we call it numeric otherwise categorical
                var categorical = _.some(csv_data, function(d2) {
                    this_value = d2[k];

                    if (this_value !== "") {
                        var pf = parseFloat(this_value)

                        if (isNaN(pf)) {
                            return true
                        }
                    }
                    return false

                })
                column_descriptions_data[k]["is_categorical"] = categorical
            }
        });

        // Set format if not exists
        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "format"))) {
                if (d["is_categorical"]) {
                    d["format"] = function(d) {
                        return d
                    }

                } else {
                    d["format"] = d3.format(",.1f")
                }
            }
        })

        // Set parser if not exists
        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "val_parser"))) {
                if (d["is_categorical"]) {
                    d["val_parser"] = function(d) {
                        return d
                    }

                } else {
                    d["val_parser"] = parseFloat
                }
            }
        })


        // Detect whether domain has been set manually. 
        _.each(column_descriptions_data, function(d, k) {
            if (!(_.has(d, "domain"))) {
                d["domain_manually_set"] = false
            } else {
                d["domain_manually_set"] = true
            }
        });
        return column_descriptions_data
};



process_csv.parse_columns = function(all_csv_data,column_descriptions_data) {

    _.each(all_csv_data, function(d) {
        _.each(column_descriptions_data, function(d2, k2) {

            d[k2] = d2["val_parser"](d[k2])

        })
    })

    return all_csv_data
}