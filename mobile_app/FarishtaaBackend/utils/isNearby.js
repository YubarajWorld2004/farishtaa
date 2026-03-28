const isNearby=(cord1,cord2)=>{
    const latDiff=Math.abs(cord1[1]-cord2[1]);
    const lngDiff=Math.abs(cord1[0]-cord2[0]);
    return latDiff <=0.0003 && lngDiff <=0.0003;
}
module.exports=isNearby;