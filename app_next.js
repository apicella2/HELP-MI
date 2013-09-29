
// Get rid of address bar on iphone/ipod
var fixSize = function() {
    window.scrollTo(0,0);
    document.body.style.height = '100%';
    if (!(/(iphone|ipod)/.test(navigator.userAgent.toLowerCase()))) {
        if (document.body.parentNode) {
            document.body.parentNode.style.height = '100%';
        }
    }
};
setTimeout(fixSize, 700);
setTimeout(fixSize, 1500);

var cacheWrite, cacheRead1, cacheRead2;
// create map
var map = new OpenLayers.Map({
        div: "map",
        theme: null,
		projection: 'EPSG:3857',
        numZoomLevels: 18,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.Zoom()
        ],
        layers: [
		            new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
                eventListeners: {
                    tileloaded: updateStatus,
                    loadend: detect
                }
            })
//            new OpenLayers.Layer.OSM("OpenStreetMap", null, { transitionEffect: 'resize' }),
//			new OpenLayers.Layer.Google("Google Streets", null, { transitionEffect: 'resize' })
/*			new OpenLayers.Layer.Google("Google Streets", null, { numZoomLevels: 20, animationEnabled:true, transitionEffect: 'resize',
			eventListeners: {
                    tileloaded: updateStatus,
                    loadend: detect
                }
				})*/
        ],
        //center: new OpenLayers.LonLat(742000, 5861000),
		        center: new OpenLayers.LonLat(10.2, 48.9)
            // Google.v3 uses web mercator as projection, so we have to
            // transform our coordinates
            .transform('EPSG:4326', 'EPSG:3857'),
        zoom: 5
    });
		
var style = {
    fillColor: '#000',
    fillOpacity: 0.1,
    strokeWidth: 0
};

//var map = new OpenLayers.Map('map');
//var layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
var vector = new OpenLayers.Layer.Vector('vector');
//map.addLayers([layer, vector]);
map.addLayer(vector);

/*
map.setCenter(
    new OpenLayers.LonLat(-71.147, 42.472).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 12
);
*/
	
var pulsate = function(feature) {
    var point = feature.geometry.getCentroid(),
        bounds = feature.geometry.getBounds(),
        radius = Math.abs((bounds.right - bounds.left)/2),
        count = 0,
        grow = 'up';

    var resize = function(){
        if (count>16) {
            clearInterval(window.resizeInterval);
        }
        var interval = radius * 0.03;
        var ratio = interval/radius;
        switch(count) {
            case 4:
            case 12:
                grow = 'down'; break;
            case 8:
                grow = 'up'; break;
        }
        if (grow!=='up') {
            ratio = - Math.abs(ratio);
        }
        feature.geometry.resize(1+ratio, point);
        vector.drawFeature(feature);
        count++;
    };
    window.resizeInterval = window.setInterval(resize, 50, point, radius);
};

var geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 7000
    }
});
map.addControl(geolocate);

var firstGeolocation = true;
geolocate.events.register("locationupdated",geolocate,function(e) {
    vector.removeAllFeatures();
    var circle = new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.Polygon.createRegularPolygon(
            new OpenLayers.Geometry.Point(e.point.x, e.point.y),
            e.position.coords.accuracy/2,
            40,
            0
        ),
        {},
        style
    );
    vector.addFeatures([
        new OpenLayers.Feature.Vector(
            e.point,
            {},
            {
                graphicName: 'cross',
                strokeColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0,
                pointRadius: 10
            }
        ),
        circle
    ]);
    if (firstGeolocation) {
        map.zoomToExtent(vector.getDataExtent());
        pulsate(circle);
        firstGeolocation = false;
        this.bind = true;
    }
});
geolocate.events.register("locationfailed",this,function() {
    OpenLayers.Console.log('Location detection failed');
});
//document.getElementById('locate').onclick = function() {
function dove_sono() {
    vector.removeAllFeatures();
    geolocate.deactivate();
    geolocate.watch = false;
    firstGeolocation = true;
    geolocate.activate();
};

dove_sono();

//////////////////////////////////////////////////// cache

    // try cache before loading from remote resource
    cacheRead1 = new OpenLayers.Control.CacheRead({
        eventListeners: {
            activate: function() {
                cacheRead2.deactivate();
            }
        }
    });
    // try loading from remote resource and fall back to cache
    cacheRead2 = new OpenLayers.Control.CacheRead({
        autoActivate: false,
        fetchEvent: "tileerror",
        eventListeners: {
            activate: function() {
                cacheRead1.deactivate();
            }
        }
    });
    cacheWrite = new OpenLayers.Control.CacheWrite({
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() {
                if (seeding) {
                    stopSeeding();
                }
                status.innerHTML = "Cache full.";
            }
        }
    });
    //var layerSwitcher = new OpenLayers.Control.LayerSwitcher();
    map.addControls([cacheRead1, cacheRead2, cacheWrite, layerSwitcher]);
    //layerSwitcher.maximizeControl();

	
    // add UI and behavior
    var status = document.getElementById("status"),
        hits = document.getElementById("hits"),
        cacheHits = 0,
        seeding = false;
    var read = document.getElementById("read");
    read.checked = true;
    read.onclick = toggleRead;
    var write = document.getElementById("write");
    write.checked = false;
    write.onclick = toggleWrite;
    document.getElementById("clear").onclick = clearCache;
    var tileloadstart = document.getElementById("tileloadstart");
    tileloadstart.checked = "checked";
    tileloadstart.onclick = setType;
    document.getElementById("tileerror").onclick = setType;
    document.getElementById("seed").onclick = startSeeding;
    
    // detect what the browser supports
    function detect(evt) {
        // detection is only done once, so we remove the listener.
        evt.object.events.unregister("loadend", null, detect);
        var tile = map.baseLayer.grid[0][0];
        try {
            var canvasContext = tile.getCanvasContext();
            if (canvasContext) {
                // will throw an exception if CORS image requests are not supported
                canvasContext.canvas.toDataURL();
            } else {
                status.innerHTML = "Canvas not supported. Try a different browser.";
            }
        } catch(e) {
            // we remove the OSM layer if CORS image requests are not supported.
            map.setBaseLayer(map.layers[1]);
            evt.object.destroy();
            layerSwitcher.destroy();
        }
    }

    // update the number of cache hits and detect missing CORS support
    function updateStatus(evt) {
        if (window.localStorage) {
            status.innerHTML = localStorage.length + " entries in cache.";
        } else {
            status.innerHTML = "Local storage not supported. Try a different browser.";
        }
        if (evt && evt.tile.url.substr(0, 5) === "data:") {
            cacheHits++;
        }
        hits.innerHTML = cacheHits + " cache hits.";
    }
    
    // turn the cacheRead controls on and off
    function toggleRead() {
        if (!this.checked) {
            cacheRead1.deactivate();
            cacheRead2.deactivate();
        } else {
            setType();
        }
    }
    
    // turn the cacheWrite control on and off
    function toggleWrite() {
        cacheWrite[cacheWrite.active ? "deactivate" : "activate"]();
    }
    
    // clear all tiles from the cache
    function clearCache() {
        OpenLayers.Control.CacheWrite.clearCache();
        updateStatus();
    }
    
    // activate the cacheRead control that matches the desired fetch strategy
    function setType() {
        if (tileloadstart.checked) {
            cacheRead1.activate();
        } else {
            cacheRead2.activate();
        }
    }
    
    // start seeding the cache
    function startSeeding() {
        var layer = map.baseLayer,
            zoom = map.getZoom();
        seeding = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels-1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        cacheWrite.activate();
        // turn off cache reading
        cacheRead1.deactivate();
        cacheRead2.deactivate();
        
        layer.events.register("loadend", null, seed);
        
        // start seeding
        map.setCenter(seeding.center, zoom);
    }
    
    // seed a zoom level based on the extent at the time startSeeding was called
    function seed() {
        var layer = seeding.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seeding.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        map.zoomIn();
        if (nextZoom === layer.numZoomLevels-1) {
            stopSeeding();
        }
    }
    
    // stop seeding (when done or when cache is full)
    function stopSeeding() {
        // we're done - restore previous settings
        seeding.layer.events.unregister("loadend", null, seed);
        seeding.layer.buffer = seeding.buffer;
        map.setCenter(seeding.center, seeding.zoom);
        if (!seeding.cacheWriteActive) {
            cacheWrite.deactivate();
        }
        if (read.checked) {
            setType();
        }
        seeding = false;
    }
	
////////////////////////////////////////// stop cache










//map.setCenter(new OpenLayers.LonLat(0, 0), 3);

////////////////////////////////////////////////////////////////////////////////////////////////////////////

function check_if_installed(){


var request = navigator.mozApps.checkInstalled(manifest_url);
request.onerror = function(e) {
  alert("Error calling checkInstalled: " + request.error.name);
};
request.onsuccess = function(e) {
  if (request.result) {
    alert("App is installed!");
  }
  else {
	
	var request = navigator.mozApps.install(manifest_url);
	request.onsuccess = function () {
	  // Save the App object that is returned
	  var appRecord = this.result;
	  alert('Installation successful!');
	};
	request.onerror = function () {
	  // Display the error information from the DOMError object
	  alert('Install failed, error: ' + this.error.name);
	};
	
  }
};

}

function check_if_firefox(){
	if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
	  
	  document.getElementById('installa').style.visibility = "visible";
	} else {
	document.getElementById('installa').style.visibility = "hidden";
	}
}

function inizio(){
	for (g in gruppi){
		document.getElementById(g).checked = false;
		var a = selectedGruppo.indexOf(g); 
		selectedGruppo.splice(a,1); // rimuove da array 
	}
}

function inizio2(){
check_if_firefox();
// 2. posizione
document.getElementById('menu_log').innerHTML = 'Imposto la posizione...';
individua_posizione(); // ha già dentro calcola_distanza

}

// INIZIALIZE
function initialize() {
//alert('initialize');
	geocoder = new google.maps.Geocoder();
	directionsDisplay = new google.maps.DirectionsRenderer();
	//var center = new google.maps.LatLng(45.464217,9.190491);
	var mapOptions = {
		center: markerHere.position,
		zoom: 15,
		minZoom: 10,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		panControl: false,
		zoomControl: true,
		zoomControlOptions: {
							style: google.maps.ZoomControlStyle.DEFAULT,
							position: google.maps.ControlPosition.RIGHT_CENTER
							},
		scaleControl: false,
		streetViewControl: false
	};
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	markerHere.setMap(map);
	
/*		  
	infowindow = new google.maps.InfoWindow({
		content: 'ohiohi',
		maxWidth: 200
	});
*/
	
	//AUTOCOMPLETE START
	var input = /** @type {HTMLInputElement} */(document.getElementById('address'));
	var autocomplete = new google.maps.places.Autocomplete(input);
	//autocomplete.bindTo('bounds', map);
	//AUTOCOMPLETE END

	//  autocomplete per ricerca
	var input2 = /** @type {HTMLInputElement} */(document.getElementById('altro'));
	var autocomplete = new google.maps.places.Autocomplete(input2);

	
	travelmode = google.maps.DirectionsTravelMode.DRIVING;


	// Create a <script> tag and set the USGS URL as the source.
	var script = document.createElement('script');
	// (In this example we use a locally stored copy instead.)
	 //script.src = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/week';
	script.src = 'data.js';
	document.getElementsByTagName('head')[0].appendChild(script);
	
	directionsDisplay.setMap(map);
	directionsDisplay.setPanel(document.getElementById('percorso'));	

	//inizio2();
	individua_posizione(); // ha già dentro calcola_distanza
	wait_for_distances += 1;
	}
// FINE INITIALIZE

function codeAddress() {
	document.getElementById("posizione").style.display = 'none';
	var address = document.getElementById('address').value;

  //alert(address);
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		document.getElementById('menu_log').style.display = 'none';
		document.getElementById('menu_standard').style.display = 'block';
		posHere = results[0].geometry.location;
		markerHere.setPosition(posHere);
		wait_for_distances += 1;
		map.setCenter(posHere);
		calcola_distanza();
		if(destinazione_scelta){
			calcola_percorso();
		}
		clearOverlays();
		showOverlays();
		//aggiorna_posizione();
		// aggiustare: se c'era percorso, ricalcolare, ecc
		//showOverlays();
    } else {
		//alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function calcola_percorso() {
	nascondi_div();
	var start = posHere;
	var end = destination;
	var request = {
		origin:start,
		destination:end,
		travelMode: travelmode// google.maps.DirectionsTravelMode.DRIVING
	};
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		destinazione_scelta = true;
		document.getElementById('menu_percorso').style.display = 'inline';
		directionsDisplay.setDirections(response);
		} else { alert('noooo'); }
	});
}

function change_mode(mode){
	travelmode = mode;
	switch(mode){
	case google.maps.DirectionsTravelMode.DRIVING:
		document.getElementById('mode').src = "img/car_b.png";
		break;
	case google.maps.DirectionsTravelMode.WALKING:
		document.getElementById('mode').src = "img/ped_b.png";
		break;
	case google.maps.DirectionsTravelMode.TRANSIT:
		document.getElementById('mode').src = "img/bus_b.png";
		break;		
	}
	
	
	document.getElementById("travelmode").style = "display:none";
	if(destinazione_scelta){
		calcola_percorso();
	}
}

function aggiorna_posizione() {
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	
	markerHere.setPosition(posHere);
	map.setCenter(posHere);
	//circle.setPosition(posHere);
	//circle.setMap(map);	
	calcola_distanza();
	if(destinazione_scelta){
		calcola_percorso();
	}
	clearOverlays();
	showOverlays();
}

function individua_posizione() {
//document.getElementById("info").style.display = 'none';
  // Try HTML5 geolocation 
  if(navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(geolocation,errorGettingPosition,{timeout:10000});
  //alert('geolocation');
  } else {
    // Browser doesn't support Geolocation
		alert('Error: Your browser doesn\'t support geolocation.');
		document.getElementById("posizione").style = "display:block";
		//document.getElementById("pos_manuale").value = "on";
		//wait_for_distances = true;
  }
	//mostra_gruppi(); 
}

function geolocation(position){
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('menu_log').innerHTML = 'Imposto la posizione...';
	//alert('position');
	posHere = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	//alert('posizione aggiornata');
	markerHere.setPosition(posHere);
	wait_for_distances += 1;	
	markerHere.setMap(map);
	map.setCenter(posHere);	
	//circle.setPosition(posHere);
	//circle.setMap(map);
	
	//mostra_gruppi();
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	document.getElementById('posizione').style.display = 'none';
	calcola_distanza();
	if (destinazione_scelta){
		calcola_percorso();
		}
	clearOverlays();
	showOverlays();	
}

function errorGettingPosition(err){
alert('Rilevamento automatico della posizione non funzionante');
	document.getElementById('menu_log').innerHTML = 'Imposta la posizione manualmente';
	mostra_posizione();
}

function drag_marker(){
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('menu_log').innerHTML = 'Muovi manualmante la posizione sulla mappa <input onclick="drag_marker_stop()" type="button" value="FINITO">';
	document.getElementById("posizione").style.display = 'none';
	//document.getElementById("map-canvas").style.display = 'block';
	markerHere.setDraggable(true);
	//posHere = new google.maps.LatLng(45.464217,9.190491);
	//markerHer.setPosition(posHere);
	//map.setCenter(posHere);
}

function drag_marker_stop(){
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	markerHere.setDraggable(false);
	posHere = markerHere.position;
	map.setCenter(posHere);
	wait_for_distances += 1;
	calcola_distanza();
	if(destinazione_scelta){
		calcola_percorso();
	}
	clearOverlays();
	showOverlays();
}

function rad(x) {
	return x*Math.PI/180;
}

function calcola_distanza(){
//alert(wait_for_distances);
	if(wait_for_distances>1)
	{
		//alert('calcola_distanza');
		var lat1 = markerHere.position.lat();
		var lon1 = markerHere.position.lng();

		for (var i = 0; i < markersArray.length; i++) {
			var lat2 = markersArray[i].position.lat();
			var lon2 = markersArray[i].position.lng();
				
			var R = 6371.0090667; // km
			var dLat  = rad( lat2 - lat1 );
			var dLong = rad( lon2 - lon1 );

			var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			var dist = R * c * 1000;
			//var testo = lat1 + ", " + lon1+"\n"+lat2+", "+lon2+"\ndist: "+dist;
			//alert(testo);
			markersArray[i].distanza = dist;
			markersArray[i].setTitle(markersArray[i].title + "\na metri " + Math.round(dist,0));
		}
	distances_ok = true;	
	}
}

function cerca_altro(){
	document.getElementById("gruppi").style.display = 'none';
	var address = document.getElementById('altro').value;
  //alert(address);
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		//alert('ok');
			for (var i = 0; i < results.length; i++) {
				var marker = new google.maps.Marker({
				  position: results[i].geometry.location,
				  map: null,
				  content: 'altro',
				  title: address,
				  distanza: '',
				  dettagli: {'INFO': results[i].formatted_address}
				});
				google.maps.event.addListener(marker, 'click', function() { info(this);});
				markersArray.push(marker);
				calcola_distanza();
			}
			selectedGruppo.push('altro')
			showOverlays();
    } else {
		//alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
			destinazione_scelta = false;
		}
	}
}

// Shows any overlays currently in the array
function showOverlays() {
//alert(distances_ok);
	if (selectedGruppo.length>0){
		for (g in selectedGruppo){
			if (markersArray.length>0) {
				if(distances_ok){
					for (i in markersArray) {
						if(markersArray[i].content == selectedGruppo[g]){
							//alert(markersArray[i].distanza);
							if(markersArray[i].distanza <= DistanzaImpostata) {
								markersArray[i].setIcon(ico_image[gruppi[selectedGruppo[g]]]['yes']);
								} else {
								markersArray[i].setIcon(ico_image[gruppi[selectedGruppo[g]]]['no']);
								}
							markersArray[i].setMap(map);
						}
					}
				} else {
					calcola_distanza()
					showOverlays()
				}
			}
		}
		//document.getElementById('info').style.display = 'none';
	}
}


function AddToSelectedGruppo(gruppo){
cbObj = document.getElementById(gruppo);
    if(cbObj.checked)
	{
	selectedGruppo.push(gruppo); //inserisce in array
	}
	else{
	var a = selectedGruppo.indexOf(gruppo); 
	selectedGruppo.splice(a,1); // rimuove da array 
	}
//	alert(selectedGruppo[0]);
	clearOverlays();
	showOverlays();
	markerCliccato.setMap(null);
	markerCliccato.ok = false;
}

function mostra(id){
var infotext = '<div id="draggable"><p align="right"><input type="button" value="x" onclick="nascondi_div()"></p></div>';
	var DivObj = document.getElementById('info');
/*	if(DivObj.style.display == "block"){
		DivObj.style.display = "none";
	} else {
	*/
		DivObj.innerHTML = infotext + document.getElementById(id).innerHTML;
		DivObj.style.display = 'block';
	//}
}

function nascondi_div(){
	document.getElementById('gruppi').style.display = 'none';
	document.getElementById('travelmode').style.display = 'none';
	document.getElementById('posizione').style.display = 'none';
	document.getElementById('percorso').style.display = 'none';
	document.getElementById('distanza').style.display = 'none';
	document.getElementById('dettagli').style.display = 'none';
	document.getElementById("info").style = "display:none";
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	if (markerCliccato.ok){
		document.getElementById('menu_dettagli').style.display = 'inline';
	} else {
		document.getElementById('menu_dettagli').style.display = 'none';
	}
	if (destinazione_scelta){
		document.getElementById('menu_percorso').style.display = 'inline';
	} else {
		document.getElementById('menu_percorso').style.display = 'none';
	}
}

function mostra_gruppi(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Seleziona i servizi da visualizzare <button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('gruppi').style.display = 'block';
}

function mostra_travelmode(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Imposta il modo di viaggio <button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('travelmode').style.display = 'block';
}

function mostra_posizione(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Imposta la posizione <button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('posizione').style.display = 'block';
}

function mostra_percorso(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Indicazioni stradali <button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('percorso').style.display = 'block';
}

function mostra_distanza(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Imposta il raggio di ricerca <button onclick="accetta()">OK</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('distanza').style.display = 'block';
}

function mostra_dettagli(){
	nascondi_div()
	document.getElementById('menu_log').innerHTML = 'Informazioni <button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('dettagli').style.display = 'block';
}

function accetta(){
	DistanzaImpostata = distance;
	//alert(DistanzaImpostata);
	clearOverlays();
	showOverlays();
	document.getElementById("distanza_menu").value = document.getElementById("meter").value;
	document.getElementById("distanza").style.display = "none";
	nascondi_div();
}

function formatta(val){
	if(val >= 1000){
	result = val/1000 + " km"
	} else {
	result = val + " m"
	}
	return result
}



function info(marker){

destination = marker.position;
//alert(destination);
var dati = marker.dettagli;
var dettagli = '<div style="float:right;"><m><img src="img/move.png" width="20px" height="20px"></m></div>';

var arrayDettagli = [];

for (k in dati){

	switch(k){
	case 'DENOMINAZ':
		arrayDettagli.splice(0,0,'<span class="DENOMINAZ">'+ dati[k] + '</span>');
		break;
	case 'INDIRIZZO':
		arrayDettagli.splice(1,0,'<span class="value">' + dati[k] + '</span>');
		break;
	case 'TELEFONO':
		arrayDettagli.splice(2,0,'<span class="value"><a href="tel:' + dati[k] + '">' + dati[k] + '</a></span>');
		break;
	case 'help_mi':
		break;
	case 'scadenza':
		break;
	default:
		arrayDettagli.push('<span class="key">'+ k + '</span>: <span class="value">' + dati[k] + '</span>');
	}
}
arrayDettagli.splice(1,0,'a metri ' + Math.round(marker.distanza,0) + '<br>');
arrayDettagli.push('<span class="key">scadenza</span>: <span class="value">' + dati['scadenza'] + '</span>');
dettagli += arrayDettagli.join('<br>');
dettagli += '<br><input type="button" value="calcola percorso" style="width:250px; heigth:100px;" onclick="calcola_percorso();">';
document.getElementById("dettagli").innerHTML = dettagli;
//infotext = dettagli + '<br><input type="button" value="calcola percorso" style="width:250px; heigth:100px;" onclick="calcola_percorso();">';
//infotext += '<br><input type="button" value="chiama" onclick="make_a_call();">';
//document.getElementById("info").innerHTML = infotext;
}	  

function pulisci(){

	clearOverlays();
	for (g in gruppi){
		document.getElementById(g).checked = false;
		var a = selectedGruppo.indexOf(g); 
		selectedGruppo.splice(a,1); // rimuove da array 
	}
	if (markerCliccato.ok){
		markerCliccato.ok = false;
		markerCliccato.setMap(null);
	}
	document.getElementById('menu_dettagli').style.display = 'none';
	//if(destinazione_scelta){
		destinazione_scelta = false;
		directionsDisplay.setMap(null);
		directionsDisplay = null;
		directionsDisplay = new google.maps.DirectionsRenderer();
		directionsDisplay.setMap(map);
		directionsDisplay.setPanel(document.getElementById('percorso'));
	//}

	document.getElementById('menu_percorso').style.display = 'none';
	map.setCenter(posHere);
}

function make_a_call(){
// Telephony object
var tel = navigator.mozTelephony;

// Check if the phone is muted (read/write property)
console.log(tel.muted);

// Check if the speaker is enabled (read/write property)
console.log(tel.speakerEnabled);

// Place a call
var call = tel.dial("0236580497");
}

