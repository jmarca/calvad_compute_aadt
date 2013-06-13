library('RJSONIO')
library(plyr)
county <- fromJSON('./06085.json',simplify=FALSE,nullValue=NA)
features <- county$features[[1]]
alldata <- features$properties$data
header <- features$header
data.range <- 3:(length(header)-1)

b <- plyr::ldply(alldata,.inform=TRUE,.fun=function(r){
  dr <- unlist(r[3:16],use.names=FALSE)
  dr
})
c <- plyr::ldply(alldata,.inform=TRUE,.fun=function(r){
  dr <- unlist(r[1:2],use.names=FALSE)
  dr
})

df <- data.frame(b)
names(df) <- header[3:16]
df$ts <- c[,1]
df$fwy <- c[,2]
df$ymdhm <- strptime(df$ts,"%Y-%m-%d %H:%M",tz='UTC')
df$ymd <- strptime(df$ts,"%Y-%m-%d")

days <- length(unique(df$ymd))

d <- plyr::ddply(df,.(fwy), summarize,
                 aadt.n   = round(sum(n)/days, 2),
                 aadt.hh  = round(sum(hh)/days, 2),
                 aadt.nhh = round(sum(not_hh)/days, 2))

d
##   fwy    aadt.n   aadt.hh   aadt.nhh
## 1 101 8456643.7 227895.13  212518.76
## 2  17  954434.7  62816.50   45892.51
## 3 237  769047.8  32755.54  133992.06
## 4 280 2602596.3 902880.40 1422221.82
## 5 680  507607.2  30431.32   22988.44
## 6  85 2117955.7  39187.07   44396.40
## 7  87  698780.8  24637.70   17412.63
## 8 880 1382260.0  36241.09   38081.19
