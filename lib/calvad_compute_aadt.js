/*global require process exports */

var _ = require('lodash')


/**
 * compute_aadt
 *
 * compute the average annual daily traffic based on hourly contents
 * for all vehicle categories
 *
 * task is a hash, task.data holds the parsed JSON hourly data from the file
 * callback is the waterfall callback, expects error, task
 *
 * returns (task) if there is an error, task.error holds error condition
 *
 * returns(null,task) if there isn't a problem, task.aadt has the
 * computed aadt for each vehicle type
 *
 * Some assumptions:
 *
 * The summation variables default to  ['n','hh','not_hh']
 *
 * You can pick different ones to look for in the header by passing
 * the argument
 *
 *     task.summation_variables=['a','b','c']
 *
 * BUT, doing so is stupid at the moment because calc_aadt.js assumes
 * that the variables are n, hh, and not_hh, and all the rest, and
 * does explicit things with them to compute sums and maxes. and so
 * on....I think.  Okay, all it really does is use the first variable
 * to check if there are any extreme outliers.
 *
 * Another key assumption is that the header is correct.  The header
 * is found at either:
 *
 *      task.header
 *      task.data.features[0].header
 *      task.data.features[0].properties.header
 *
 * with the first being preferred.
 *
 * If it isn't there, I do not go to any effort to find it, and this
 * program will crash.  Anyway, the idea of header is that it provides
 * a mapping from names to columns, because of course it just takes up
 * too much space and bandwidth to store each row of data as a hash
 * with a proper name.  So for example, if header is ['a','b','c'],
 * then in the data row 0 corresponds to the measurement for variable
 * 'a', and variable 'c' is found in row 2.
 *
 * The input data is also grouped, according to the breaks defined in
 * the data itself.  To pick the breaks column, pass a variable
 * 'breaks' in the passed in task.  It will default to 'freeway'
 *
 * The code will group the input data according to the levels in the
 * breaks column.  Then I compute the aadt for each grouping.  If you
 * want to do something fancy, say use a timestamp to compute day of
 * week or something, do that first, store the levels in a column in
 * the data, make sure the task.header properly includes this column,
 * and pass in task.breaks='your fancy variable'
 *
 * In code, the grouping and summing is as follows:
 *
 *   // first define the mapping function
 *   var fwygrouper = function(element,index){
 *       return element[unmapper['freeway']]
 *   }
 *   // then invoke the mapping function to split up the input into groups
 *   var intermediate = _.groupBy(data,fwygrouper)
 *   // then invoke the aadt code on the input groups.
 *   _.each(intermediate
 *         ,calcaadt);
 *
 *
 *
 *
 */
function compute_aadt(task,callback){
    // going to compute this:

    var breaks = 'freeway'
    if(task.breaks !== undefined) breaks = task.breaks

    var ts_column = 'ts'
    if(task.ts_column !== undefined) ts_column = task.ts_column

    var summation_variables = ['n','hh','not_hh']
    if(task.summation_variables !== undefined) summation_variables = task.summation_variables


    task.aadt = {}

    // header is an array of column names
    var header = task.header ||
        task.data.features[0].header ||
        task.data.features[0].properties.header
    if(header === undefined) throw new Error('header is not defined in the task.  '
                                             + 'Put a header array in task.header.  '
                                             + 'See the source code documentation '
                                             + 'for more information')
    // data is an array of arrays,
    // features is possibly an array
    // combine things
    var data = []
    _.each(task.data.features
          ,function(feature){
               data.push(feature.properties.data)
           });
        data = _.flatten(data,true)
    task.flatdata = data
    var unmapper = {}
    _.each(header
          ,function(value,idx){
               unmapper[value]=idx
           });

    // iterate over the hours.
    // count up the days
    // add up the hourly volumes for n,heavyheavy,not_heavyheavy
    // divide volumes by number of days to get AADT
    //

    // want to keep track of freeways here, and also compute the
    // total aadt for the grid.
    //
    // the per-freeway AADT is useless, but perhaps a way to check
    // if my underlying assumption that the hourly vol/aadt is a
    // common characteristic of the grid.

    // need to check if data is arrays by freeway, or just lumped data

    // a function to group records by changes in the column 'breaks' (initially set to freeway)
    var fwygrouper = function(element,index){
        return element[unmapper[breaks]]
    }

    var intermediate = _.groupBy(data,fwygrouper)

    // so intermediate holds groups.  now just have to sum up and
    // divide by days to get aadt per level of the variable breaks
    // (for example, per freeway)

    // create the summation function for the data
    var calcaadt = require('./calc_aadt')(unmapper,summation_variables,ts_column)

    _.each(intermediate
          ,function(data,key){
               task.aadt[key] = calcaadt(data)
           })

    return callback(null,task)

}
module.exports=compute_aadt
