var _ = require('lodash')

function pad(n){return n<10 ? '0'+n : n}

function day_formatter(d){
    return [d.getFullYear()
           , pad(d.getMonth()+1)
           , pad(d.getDate())]
        .join('-')
}


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
        var filtered = _.filter(data
                               ,function(rec){
                                    return rec[unmapper[sum_variables[0]]]/end[0] < 1
                                })
        if(filtered.length < data.length){
            console.log('redo aadt computation')
            console.log(end)
            // if this is true, we have outliers, and must prune them.

            // not sure why I was/am doing this
            // task.flatdata=filtered

            // reset reduce
            // zero volume at start of summation
            for(var i=0,j=sum_variables.length; i<j; i++){
                start[i]=0
            }
            days={}
            // redo reduce
            end = _.reduce(filtered,sum_aadt,start)
            numdays=_.size(days)
            end =  _.map(end
                        ,function(value,veh_type){
                             return value / numdays
                         });
            console.log(end)
            // okay, the worst outliers just got dropped.  Not
            // perfect, but better
        }
        var final_result = {}
        _.each(end
              ,function(value,veh_type){
                   final_result[sum_variables[veh_type]] = value
               });
        return final_result
    }
}
module.exports=calc_aadt
