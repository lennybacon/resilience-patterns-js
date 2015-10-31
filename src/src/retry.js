(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'/*, 'b'*/], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(exports/*, require('b')*/);
    } else {
        // Browser globals
        factory((root.exports = {}), root.b);
    }
}(this, function (exports, b) {
    //use b in some fashion.

    // attach properties to the exports object to define
    // the exported module properties.
    exports.retry = function () {

      function sleep(millis)
      {
        var date = new Date();
        var curDate = null;
        do { curDate = new Date(); }
        while(curDate-date < millis);
      }

    /**
     * Executed the given function with retries and delays in between those.
     * @param  {Function} func   The function to execute.
     * @param  {Nnumber} amount The amount of retires
     * @param  {Array} delays The delays between the retries in milliseconds.
     * @return {object} The return value of the evaluated func parameter.
     */
      this.exec = function(func, amount, delays){
        if(!amount){
          amount = 3;
        }
        if(!delays){
          delays = [1000];
        }
        else if(!Array.isArray (delays)){
          delays = [delays];
        }

        if(amount > delays.length){
          for (var i = 0; i < amount; i++) {
            if(delays.length < i+1){
              delays.push(delays[delays.length-1]);
            }
          }
        }
        var success = false;
        var retries = 0;
        var value = null;
        do{
          try{
            value = func();
            success = true;
          } catch(e){
            if(retries >= amount){
              throw e;
            }
            sleep(delays[retries]);
          }
          retries++;
        }while(!success || retries < amount);
        return value;
      }
    };
}));