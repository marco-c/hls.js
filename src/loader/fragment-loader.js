 /*
 * fragment loader
 *
 */

import Event                from '../events';
import observer             from '../observer';
import {ErrorTypes,ErrorDetails} from '../errors';

 class FragmentLoader {

  constructor(hls) {
    this.hls=hls;
    this.onfl = this.onFragLoading.bind(this);
    observer.on(Event.FRAG_LOADING, this.onfl);
  }

  destroy() {
    if(this.loader) {
      this.loader.destroy();
      this.loader = null;
    }
    observer.off(Event.FRAG_LOADING, this.onfl);
  }

  onFragLoading(event,data) {
    var frag = data.frag;
    this.frag = frag;
    this.frag.loaded = 0;
    var config = this.hls.config;
    frag.loader = this.loader = new config.loader();
    this.loader.load(frag.url,'arraybuffer',this.loadsuccess.bind(this), this.loaderror.bind(this), this.loadtimeout.bind(this), config.fragLoadingTimeOut, config.fragLoadingMaxRetry,config.fragLoadingRetryDelay,this.loadprogress.bind(this));
  }

  loadsuccess(event, stats) {
    var payload = event.currentTarget.response;
    stats.length = payload.byteLength;
    // detach fragment loader on load success
    this.frag.loader = undefined;
    observer.trigger(Event.FRAG_LOADED,
                    { payload : payload,
                      frag : this.frag ,
                      stats : stats});
  }

  loaderror(event) {
    this.loader.abort();
    observer.trigger(Event.ERROR, { type : ErrorTypes.NETWORK_ERROR, details : ErrorDetails.FRAG_LOAD_ERROR, fatal:false,frag : this.frag, response:event});
  }

  loadtimeout() {
    this.loader.abort();
    observer.trigger(Event.ERROR, { type : ErrorTypes.NETWORK_ERROR, details : ErrorDetails.FRAG_LOAD_TIMEOUT, fatal:false,frag : this.frag});
  }

  loadprogress(event, stats) {
    this.frag.loaded = stats.loaded;
   observer.trigger(Event.FRAG_LOAD_PROGRESS, { frag : this.frag, stats : stats});
  }
}

export default FragmentLoader;
