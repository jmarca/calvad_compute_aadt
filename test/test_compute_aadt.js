/* global require console process it describe after before */

var should = require('should')

var async = require('async')
var _ = require('lodash')
var compute_aadt = require('../.')
var fs = require('fs')

describe('compute_aadt',function(){
    it('should properly compute aadt from hourly file'
      ,function(done){
           var task={file:'./test/files/hourly/2009/100/263.json'}
           fs.readFile(task.file
                      ,function(err,text){
                           should.not.exist(err)
                           should.exist(text)
                           task.data = JSON.parse(text)
                           compute_aadt(task
                                       ,function(err,cbtask){
                                            // file should not exist
                                            should.not.exist(err)
                                            should.exist(cbtask)
                                            cbtask.aadt.should.have.property('101')
                                            cbtask.aadt['101'].should.have.property('n')
                                            var rounded = Math.floor(cbtask.aadt['101'].n)
                                            rounded.should.eql( Math.floor(3154748))
                                            cbtask.aadt['101'].should.have.property('hh')
                                            rounded = Math.floor(10000 * cbtask.aadt['101'].hh)
                                            rounded.should.eql( Math.floor( 10713955.44   /365 * 10000))
                                            cbtask.aadt['101'].should.have.property('not_hh')
                                            rounded = Math.floor(10000 * cbtask.aadt['101'].not_hh)
                                            rounded.should.eql( Math.floor(11791466.6/365 *10000))
                                            done()

                                        })
                       })
       })
    it('should properly compute aadt from hourly file, take two'
      ,function(done){
           var task={file:'./test/files/hourly/2008/133/154.json'}
           fs.readFile(task.file
                      ,function(err,text){
                           should.not.exist(err)
                           should.exist(text)
                           task.data = JSON.parse(text)
                           compute_aadt(task
                                       ,function(err,cbtask){
                                            // file should not exist
                                            should.not.exist(err)

                                            should.exist(cbtask)
                                            cbtask.aadt.should.have.property('280')
                                            cbtask.aadt['280'].should.have.property('n')
                                            var rounded = Math.round(cbtask.aadt['280'].n)
                                            rounded.should.eql(7867433)
                                            // flat data should be shorter than starting
                                            var data = []
                                            _.each(cbtask.data.features
                                                  ,function(feature){
                                                       data.push(feature.properties.data)
                                                   });
                                            data = _.flatten(data,true)
                                            data.length.should.be.above(cbtask.flatdata.length - 1)
                                            done()

                                        })
                       })
       })

    it('should properly compute aadt from hourly file take three'
      ,function(done){
           var task={file:'./test/files/hourly/2009/06085.json'}
           // computed with R.  see file test/files/hourly/2009/Rscratch.R
           var expected_result ={
               101: {'n': 8456643.7, 'hh': 227895.13, 'not_hh':  212518.76}
             ,17:  {'n':  954434.7, 'hh':  62816.50, 'not_hh':   45892.51}
             ,237: {'n':  769047.8, 'hh':  32755.54, 'not_hh':  133992.06}
             ,280: {'n': 2602596.3, 'hh': 902880.40, 'not_hh': 1422221.82}
             ,680: {'n':  507607.2, 'hh':  30431.32, 'not_hh':   22988.44}
             ,85:  {'n': 2117955.7, 'hh':  39187.07, 'not_hh':   44396.40}
             ,87:  {'n':  698780.8, 'hh':  24637.70, 'not_hh':   17412.63}
             ,880: {'n': 1382260.0, 'hh':  36241.09, 'not_hh':   38081.19}
           }

           fs.readFile(task.file
                      ,function(err,text){
                           should.not.exist(err)
                           should.exist(text)
                           task.data = JSON.parse(text)
                           compute_aadt(task
                                       ,function(err,cbtask){
                                            // file should not exist
                                            should.not.exist(err)
                                            should.exist(cbtask)
                                            _.each(cbtask.aadt
                                                  ,function(result,fwy){
                                                       var rounded = Math.round(result.n*10)
                                                       rounded.should.eql(Math.round(expected_result[fwy].n*10))
                                                       rounded = Math.round(result.hh*10)
                                                       rounded.should.eql(Math.round(expected_result[fwy].hh*10))
                                                       rounded = Math.round(result.not_hh*10)
                                                       rounded.should.eql(Math.round(expected_result[fwy].not_hh*10))
                                                       return null
                                                   })
                                            done()

                                        })
                       })
       })
})
