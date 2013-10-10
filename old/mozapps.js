
// manage a webapp.
// place <link rel="app-manifest" href="path-to-manifest.webapp"> in your <head>
// mozApps.install() attempts installation
// mozApps.uninstall() removes
// mozApps.isRunning() indicates whether the app is currently installed and open
var mozApps = (function() {
    var manLink = document.querySelector('link[rel="app-manifest"]'),
        manifestURL = manLink.getAttribute('href');

    var self = false;

    var selfReq = navigator.mozApps.getSelf();
    selfReq.onsuccess = function() {
        self = selfReq.result;
    };

	function installed(success, error) {
		var r = navigator.mozApps.checkInstalled(manifestURL);
		r.onerror = function(e) {
			alert("Error calling checkInstalled: " + r.error.name);
		};
		r.onsuccess = function(e) {
			b = document.getElementById('installa');
			if (r.result) {
				//alert("App is installed!");
				b.style = "display:none;";
			}
			else {
				b.style = "display:block;position:absolute;top:0px;left:0px;z-index:100;";
				//install();
			}
		}
		return r;
	}  
    function isRunning() {
		//alert('isrunning');
        return !!self;
    }
    function install(success, error) {
		//alert('install');
        var r = navigator.mozApps.install(manifestURL);
        r.onsuccess = success;
        r.onerror = error;
        r.addEventListener('error', function() {
            alert('Installation Failed with Error: ' + this.error.name);
        });
        return r;
    }
    function uninstall() {
		//alert('unistall');
        if (self)
            return self.uninstall();
    }

    return {
		installed: installed,
        isRunning: isRunning,
        install: install,
        uninstall: uninstall,
        manifest: manifestURL
    };
})();

