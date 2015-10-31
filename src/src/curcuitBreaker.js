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

    exports.circuitBreakerState = {
        closed: 0,
        halfOpen: 1,
        open: 2
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.circuitBreaker = function (
        failureThreshold,
        recoveryThreshold,
        timeout
      ) {
          var that = this;
        var _failureCount = 0;
        var _successCount = 0;
        var _recoveryCount = 0;
        var _failureThreshold = failureThreshold | 5;
        var _recoveryThreshold = recoveryThreshold | 1;
        var _timeout = timeout | 60000;
        var _ignoredExceptions = [];
        var _state = exports.circuitBreakerState.closed;
        var _timer = null;
        
        function changeState(newState){
          var before = _state;
          _state = newState;
          that.onCircuitBreakerStateChanged(before, newState);
        };
        
        function incrementRecoveryCount(){
          if (_state !== exports.circuitBreakerState.halfOpen) {
            return;
          }
          _recoveryCount++;
          if (_recoveryCount < _recoveryThreshold) {
            return;
          }
          if (_state === exports.circuitBreakerState.closed) {
            return;
          }
          that.reset();
        };
        
        function incrementSuccessCount(){
          var before = that.getServiceLevel();
          _successCount++;
          var after = that.getServiceLevel();
          that.onServiceLevelChanged(before, after);
        };
        
        function incrementFailureCount(){
          var before = that.getServiceLevel();
          _failureCount++;
          var after = that.getServiceLevel();
          that.onServiceLevelChanged(before, after);
        }
        
        function timerElapsed(){
          if (_state !== exports.circuitBreakerState.open) {
            return;
          }
          changeState(exports.circuitBreakerState.halfOpen);
          _recoveryCount = 0;
          clearTimeout(_timer);    
        }
        
        function trip(){
          if (_state === exports.circuitBreakerState.open)
          {
            return false;
          }
          changeState(exports.circuitBreakerState.open);
          _timer = setTimeout(timerElapsed, _timeout);
          return true;
        };
        
        function tripAndThrow(ex){
          if(trip()){
            throw { name: 'Error', message: 'Circuit opened', innerException: ex };     
          }
        };
        
        function handleException(ex){
          if (_state === exports.circuitBreakerState.halfOpen) {
            tripAndThrow(ex);
            return;
          }
          if (_failureCount < _failureThreshold){
            incrementFailureCount();
          }
          if (_failureCount >= _failureThreshold)
          {
            tripAndThrow(ex);
          }
        };
        
        this.onCircuitBreakerStateChanged = function(){
            
        };
        
        this.onServiceLevelChanged = function(){
            
        };

        this.getFailureCount = function(){
          return _failureCount;
        };
        this.getSuccessCount = function(){
          return _successCount;
        };
        this.getRecoveryCount = function(){
          return _recoveryCount;  
        };
        this.getFailureThreshold = function(){
          return _failureThreshold;  
        };
        this.getRecoveryThreshold = function(){
          return _recoveryThreshold;
        };
        this.getTimeout = function(){
          return _timeout;
        };
        this.getIgnoredExceptions = function(){
          return _ignoredExceptions; 
        };
        this.addIgnoredException = function(ex){
          _ignoredExceptions.push(ex.message);
        };
        this.getState = function(){
          return _state; 
        };
        this.reset = function (){
          _failureCount = 0;
          _successCount = 0;
          _recoveryCount = 0;
          changeState(exports.circuitBreakerState.closed);
          clearTimeout(_timer);
        };
        this.getServiceLevel = function(){
          var totalCalls = _failureCount + _successCount;
          if (totalCalls === 0)
          {
            return 100;
          }
          if (_successCount === 0)
          {
            return 0;
          }
          if (totalCalls === _successCount)
          {
            return 100;
          }
          if (_failureCount === 0)
          {
            return 100;
          }
          return _failureCount / (totalCalls / 100);
        };
        
        this.exec = function(func){
          try{
            var result = func();
            incrementRecoveryCount();
            incrementSuccessCount();
            return result;
          }
          catch(ex){
            if (_ignoredExceptions.indexOf(ex.message) > -1)
            {
                throw ex;
            }
            handleException(ex);
            return null;
          }
        }
    };
}));