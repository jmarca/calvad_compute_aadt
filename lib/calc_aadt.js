var _ = require('lodash')

function pad(n){return n<10 ? '0'+n : n}

function day_formatter(d){
    return [d.getFullYear()
           , pad(d.getMonth()+1)
           , pad(d.getDate())]
        .join('-')
}

/**
 * calc_aadt
 *
 * initialize with unmapper, summation variables, and the timestamp column name.
 *
 * The result is an object with a result for each of the summation variables.
 *
 * If there are outliers, the resulting object contains an attribute
 * called 'outliers' that holds an array containing the outlier
 * records.  See the code for details, but these outliers are
 * determined by first running through all the data and computing the
 * average annual daily traffic.  Then a second pass is made to
 * identify all *hourly* values (looking at the first summation
 * variable only) that are greater than the average annual daily sum
 * for that first variable.  In other words, one hour puts out more
 * than the average day.  This is too big.
 *
 * Then those outliers are removed, the aadt is recomputed and returned.
 *
 * It is possible that another pass would drop still more outliers, by
 * this definition, but in studying random detector locations with
 * outliers that pass the above definition, usually the most extreme
 * cases are removed.  It makes sense that a particular hour might
 * actually spit out an entire day's worth of traffic, say on an
 * exceptionally busy day in a rural area where most of the daily
 * traffic happens in the peak periods anyway.  So I don't want to be
 * too extreme here.  One pass is good enough for now.
 *
 */
function  calc_aadt(unmapper,sum_variables,ts_column){

    return function(data){

        // data is all the data to sum up,by column.  Theoretically a
        // subset of the big data, but really I don't care inside this
        // code

        // start is the starting point for the map summing function
        var start=new Array(sum_variables.length)
        // zero volume at start of summation
        for(var i=0,j=sum_variables.length; i<j; i++){
            start[i]=0
        }
        var days={}

        // make two passes max.  first pass computes aadt.  then check
        // that all intervals put out less than aadt.  if not, drop
        // those periods, and recompute aadt in second pass
        function sum_aadt(memo,rec){
            // simple sums of volumes, ignore the rest
            _.each(sum_variables
                  ,function(v,i){
                       memo[i]+=rec[unmapper[v]]
                   });
            var d = new Date(rec[unmapper[ts_column]])
            var day = day_formatter(d)
            if(days[day]===undefined){
                days[day]=1
            }
            return memo
        }
        var end = _.reduce(data,sum_aadt,start)
        // have the sum of volumes.  Divide by days to get average annual daily
        var numdays=_.size(days)
        end =  _.map(end
                    ,function(value,veh_type){
                         return value / numdays
                     });
        var grouped = _.groupBy(data
                               ,function(rec){
                                    return rec[unmapper[sum_variables[0]]]/end[0] > 1 ? 'outlier':'okay'
                                })
        var final_result = {}
        if(grouped.outlier !== undefined && grouped.outlier.length > 0 ){
            console.log('redo aadt computation, '+(grouped.outlier.length) + ' out of '+data.length+' are putting out hourly volumes that are higher than computed AADT.')
            console.log('computed aadt')
            console.log(end)

            var iterate = 10
            var prior = grouped.outlier.length - 1
            while (iterate-- >0 && grouped.outlier !== undefined && grouped.outlier.length > 0  && grouped.outlier.length > prior){
                // if this is true, we have outliers, and must prune them.
                prior = grouped.outlier.length
                final_result.outliers=grouped.outlier

                // reset reduce
                // zero volume at start of summation
                for(var i=0,j=sum_variables.length; i<j; i++){
                    start[i]=0
                }
                days={}
                // redo reduce
                end = _.reduce(grouped.okay,sum_aadt,start)
                numdays=_.size(days)
                end =  _.map(end
                            ,function(value,veh_type){
                                 return value / numdays
                             });
                grouped = _.groupBy(data
                                   ,function(rec){
                                        return rec[unmapper[sum_variables[0]]]/end[0] > 1 ? 'outlier':'okay'
                                    })
                console.log('outlier removal iteration '+(10-iterate))
            }
            console.log('recomputed aadt')
            console.log(end)
            // okay, the worst outliers just got dropped.  Not
            // perfect, but better
        }
        _.each(end
              ,function(value,veh_type){
                   final_result[sum_variables[veh_type]] = value
               });
        return final_result
    }
}
module.exports=calc_aadt
