var map;
var markerHere_layer;
var drag;
var servizi_layer, markerSelected, filter, filterStrategy, styleDist;
var size, offset, icon;
var posHere, markerHere;
var percorso_layer, from, to, route_type = 'car';
var destinazione_scelta = false;
var servizi_scelti = [];

function init() {
	height = window.screen.availHeight-30;
	document.getElementById("map").style.height = height + "px";
	var lon = 9.190491;
	var lat = 45.464217;
	var zoom = 17;
	posHere = new OpenLayers.LonLat(lon, lat).transform("EPSG:4326", "EPSG:900913");
	
    map = new OpenLayers.Map({
        div: "map",
		layers: [new OpenLayers.Layer.OSM('basemap_layer')],
        projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326"),
		center: posHere,
		zoom: zoom
    });
    
// geolocation
	markerHere_layer = new OpenLayers.Layer.Markers('markerHere_layer');//,{projection: new OpenLayers.Projection("EPSG:4326")});
	map.addLayer(markerHere_layer);
	
	size = new OpenLayers.Size(21,25);
	offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
	markerHere = new OpenLayers.Marker(posHere,icon);
	markerHere_layer.addMarker(markerHere);
	
	
	//drag = new OpenLayers.Control.DragFeature(markerHere_layer);
	//map.addControl(drag);
	
// servizi
	carica_servizi();
	localizzami();
	//carica_dati();

// percorsi
	percorso_layer = new OpenLayers.Layer.Vector("percorso_layer");
	map.addLayer(percorso_layer);

}

function carica_servizi(){	
	filterStrategy = new OpenLayers.Strategy.Filter({}); //filter: filter});
	var layerListeners = {
		featureclick: function(e) {
			//alert(e.feature.attributes.distanza); //e.object.name + " says: " + e.feature.id + " clicked.");
			destinazione_scelta = true;
			document.getElementById('menu_dettagli').style.display = "inline";
			//var f = e.feature;
			markerSelected = e.feature; //.geometry.getCentroid(); // x e y
			info();
			mostra_dettagli();
			//alert(markerSelected.x);
			//alert(markerSelected.x + ', ' + markerSelected.y);
			//alert(e.feature.id);
			//var position = servizi_layer.events.getMousePosition(e.feature);
			//map.setCenter(position);
			//var position = e.feature.geometry.getCentroid().x;
			//alert(position);
			return false;
		},
		nofeatureclick: function(e) {
			//alert(e.object.name + " says: No feature clicked.");
			//destinazione_scelta = false;
			//document.getElementById('menu_dettagli').style.display = "none";
		}
	};
	styleDist = new OpenLayers.Style();
	servizi_layer = new OpenLayers.Layer.Vector("servizi_layer", {
			projection: map.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed(), filterStrategy],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "dati.json",
                format: new OpenLayers.Format.GeoJSON()
            }),
			styleMap: new OpenLayers.StyleMap({'default': styleDist}),
			eventListeners: layerListeners
        });
	map.addLayer(servizi_layer);
}

function style_filter_servizi(){
	var rules_servizi = [];
	for (var servizio in gruppi) {
		rule_servizio = new OpenLayers.Rule({
				filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters: [
					new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.EQUAL_TO,
						property: "help_mi",
						value: servizio
					}),
					new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
						property: "distanza",
						value: DistanzaImpostata
					})
				]
				}),
				symbolizer: {
					externalGraphic: ico_image[gruppi[servizio]]['yes']
				}
			});
		rules_servizi.push(rule_servizio);
		rule_servizio = new OpenLayers.Rule({
				filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters: [
					new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.EQUAL_TO,
						property: "help_mi",
						value: servizio
					}),
					new OpenLayers.Filter.Comparison({
						type: OpenLayers.Filter.Comparison.GREATER_THAN,
						property: "distanza",
						value: DistanzaImpostata
					})
				]
				}),
				symbolizer: {
					externalGraphic: ico_image[gruppi[servizio]]['no']
				}
			});
		rules_servizi.push(rule_servizio);
		//alert(ico_image[gruppi[servizio]]['no']);
	}

	styleDist = new OpenLayers.Style(
        {
            graphicWidth: 30,
            graphicHeight: 30,
            graphicYOffset: -15,
        },
        {
            rules: rules_servizi
        }
    );

	filter = new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "help_mi",
			value: ""
	});

}

function calcola_distanza(){
	var y1 = posHere.lat;
	var x1 = posHere.lon;
	var features = servizi_layer.features;
	for (var i=0; i<features.length; i++) {
		var y2 = features[i].geometry.y;
		var x2 = features[i].geometry.x;
		var dist = Math.round(Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2)));
		features[i].attributes.distanza = dist;
	}
	style_filter_servizi();
	aggiorna_servizi();
}

function aggiorna_servizi(){
	if (servizi_scelti.length > 0) {
	//filterStrategy.deactivate();
	//alert(servizi_scelti.length);
		if (servizi_scelti.length > 1) {
			var filtri_servizi = [];
			for (var i = 0; i < servizi_scelti.length; i++) {
			//alert(servizi_scelti[i]);
				filtro_servizio =  new OpenLayers.Filter.Comparison({
					type: OpenLayers.Filter.Comparison.EQUAL_TO,
					property: "help_mi",
					value: servizi_scelti[i]
				});
				filtri_servizi.push(filtro_servizio);
			}
			
			filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.OR,
				filters: filtri_servizi
			});
			
		} else {
		//alert(servizi_scelti[0]);
			filter = new OpenLayers.Filter.Comparison({
				type: OpenLayers.Filter.Comparison.EQUAL_TO,
				property: "help_mi",
				value: servizi_scelti[0]
			});
		}
	} else {
		filter = new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.EQUAL_TO,
			property: "help_mi",
			value: ""
		});	
	}
	filterStrategy.setFilter(filter);
	servizi_layer.redraw();
	//alert('fine filter');
}

function data_gruppo(){
	var geojson_format = new OpenLayers.Format.GeoJSON();
	//vector_layer.addFeatures(geojson_format.read(data);


/*
geojson_layer = new OpenLayers.Layer.Vector("GeoJSON", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "ml/lines.json",
                format: new OpenLayers.Format.GeoJSON()
            })
        });
*/

    /**
     * Here we create a new style object with rules that determine
     * which symbolizer will be used to render each feature.
     */
    var style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            graphicWidth: 21,
            graphicHeight: 25,
            graphicYOffset: -28, // shift graphic up 28 pixels
            label: "${help_mi}" // label will be foo attribute value
        },
        // the second argument will include all rules
        {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LESS_THAN,
                        property: "foo", // the "foo" feature attribute
                        value: 25
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        externalGraphic: "img/marker-blue.png"
                    }
                }),
                new OpenLayers.Rule({
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        externalGraphic: "img/marker.png"
                    }
                })
            ]
        }
    );
    
	
	
}

function localizzami() {
  if(navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(geolocation,errorGettingPosition,{timeout:7000});
  } else {
		alert('DEVI INSERIRE LA POSIZIONE MAUALMENTE');
  }
}

function geolocation(position){
	markerHere_layer.removeMarker(markerHere);
	posHere = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform("EPSG:4326", "EPSG:900913");
	markerHere = new OpenLayers.Marker(posHere,icon);
	markerHere_layer.addMarker(markerHere);
	map.setCenter(posHere);
	//alert('localizzato');
}

function errorGettingPosition(err){
	alert('Rilevamento automatico della posizione non funzionante');
}

function spostami_start(){
	drag.activate();
}

function spostami_stop(){
	drag.deactivate();
}

function calcola_percorso(){
	if (percorso_layer.features.length > 0){ percorso_layer.removeAllFeatures(); }
/*
http://routes.cloudmade.com/<APIKEY>/api/0.3/start_point,[[transit_point1,...,transit_pointN]],end_point/route_type[/route_type_modifier].output_format[?lang=(en|de)][&units=(km|miles)]
    start_point - latitude, longitude of the start point of the route separated by the comma (lat,lon)
    end_point - latitude, longitude of the end point of the route separated by the comma (lat,lon)
    route_type - type of the route ("car", "foot", "bicycle")
    output_format - format of the output results ("js", "gpx")
    transit_points - list of points (lat,lon) that the route must visit (in specified order) before reach end_point. List of transit points should be passed in square brackets, e.g [51.2227,4.4120,51.2,4.41]
    route_type_modifier - modifier of the route type, for now only valid value is "shortest" for route type "car"
    lang - iso 2 characters code for language for the route instructions, if missing taken from the Accept-Language header, default is en. Possible values are listed on Documentation page.
    units - measure units for distance calculation (km or miles). Default - km
    callback - optional parameter for JS response, if specified response will be wrapped into the function call. e.g. if callback=routeLoaded, response will be routeLoaded(JSON_object)
*/
/*	var start_point = (47.25976,9.58423);
	var url = "http://routes.cloudmade.com/8ee2a50541944fb9bcedded5165f09d9/api/0.3/47.25976,9.58423,47.26117,9.59882/bicycle.js";
	var options = {	projection: map.displayProjection,
					strategies: [new OpenLayers.Strategy.Fixed()],
					protocol: new OpenLayers.Protocol.HTTP({url: url,
															format: new OpenLayers.Format.GeoJSON()
															})
					};
var route_layer = new OpenLayers.Layer.Vector("GeoJSON", options);
map.addLayer(route_layer);*/
	from = posHere;
	from.transform("EPSG:900913", "EPSG:4326"); //new OpenLayers.LonLat(9.58423, 47.25976);
	to = new OpenLayers.LonLat(markerSelected.geometry.x,markerSelected.geometry.y);
	to.transform("EPSG:900913", "EPSG:4326"); //new OpenLayers.LonLat(9.59882, 47.26117);
	//alert(to.x + ', ' + to.y);
	//to = new OpenLayers.LonLat(9.59882, 47.26117);
	addScript ('http://routes.cloudmade.com/BC9A493B41014CAABB98F0471D759707/api/0.3/' + from.lat + ',' + from.lon + ',' + to.lat + ',' + to.lon + '/' + route_type + '.js?lang=it&callback=getRoute');
	//posHere = from.transform("EPSG:4326", "EPSG:900913");
	//map.setCenter(posHere);
}

//
function addScript (url) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
}
		
function getRoute (response) {
	if(response.status==0){
		var point,
			geometry,
			feature,
			points = [],
			testo = '';
		for (var i = 0; i < response.route_geometry.length; i++) {
		   point = new OpenLayers.Geometry.Point(response.route_geometry[i][1], response.route_geometry[i][0]);
		   points.push(point.transform("EPSG:4326", "EPSG:900913"));
		   testo = testo + response.route_instructions[i][1] + '<br>';
		}
		geometry = new OpenLayers.Geometry.LineString(points);
		feature = new OpenLayers.Feature.Vector(geometry, null, {
			strokeColor: "#0033ff",
			strokeOpacity: 0.7,
			strokeWidth: 5
		});
		if (percorso_layer.features.length > 0){ percorso_layer.removeAllFeatures(); }
		percorso_layer.addFeatures(feature);
		document.getElementById('percorso').innerHTML = testo;
		document.getElementById('menu_percorso').style.display = 'inline';
	} else {
		alert(response.status_message);
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function start(){
	if (window.screen.availWidth >= 300){
		document.getElementById('log').style.display = 'inline';
	} else {
		document.getElementById('log').style.display = 'none';
	}
}

function nascondi_div(){
	var div = ['div_gruppi',
		'percorso',
		'travelmode',
		'posizione',
		'distanza',
		'dettagli'];
	
	for (var i = 0; i < div.length; i++){
		document.getElementById(div[i]).style.display = 'none';
		}
	document.getElementById('opzioni').style.display = 'inline';
	document.getElementById('log').innerHTML = '';
	document.getElementById('pulsanti').innerHTML = '';
}

function mostra_gruppi(){
	nascondi_div();
	document.getElementById('log').innerHTML = 'Seleziona i servizi da visualizzare';
	document.getElementById('pulsanti').innerHTML = '<button onclick="nascondi_div();calcola_distanza();">FINITO</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('div_gruppi').style.display = 'block';
}

function AddToSelectedGruppo(gruppo){
	cbObj = document.getElementById(gruppo);
    if (cbObj.className == "notsel") {
		servizi_scelti.push(gruppo);
		cbObj.className = "yessel";
	} else {
		var a = servizi_scelti.indexOf(gruppo); 
		servizi_scelti.splice(a,1); // rimuove da array 
		cbObj.className = "notsel";
	}
}

function mostra_posizione(){
	nascondi_div();
	document.getElementById('log').innerHTML = 'Imposta la posizione';
	document.getElementById('pulsanti').innerHTML = '<button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('posizione').style.display = 'block';
}

function mostra_travelmode(){
	nascondi_div();
	document.getElementById('log').innerHTML = 'Imposta il modo di viaggio';
	document.getElementById('pulsanti').innerHTML = '<button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('travelmode').style.display = 'block';
}

function change_mode(mode){
	route_type = mode;
	switch(mode){
	case 'car':
		document.getElementById('mode').src = "img/car_b.png";
		break;
	case 'foot':
		document.getElementById('mode').src = "img/ped_b.png";
		break;		
	}
	if(destinazione_scelta){
		calcola_percorso();
	}
}

function mostra_distanza(){
	nascondi_div()
	document.getElementById('log').innerHTML = 'Imposta il raggio di ricerca';
	document.getElementById('pulsanti').innerHTML = '<button onclick="accetta_raggio()">OK</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('distanza').style.display = 'block';
}

function mostra_percorso(){
	nascondi_div();
	document.getElementById('log').innerHTML = 'Indicazioni stradali';
	document.getElementById('pulsanti').innerHTML = '<button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('percorso').style.display = 'block';
}

function mostra_dettagli(){
	nascondi_div();
	document.getElementById('log').innerHTML = 'Informazioni';
	document.getElementById('pulsanti').innerHTML = '<button onclick="nascondi_div()">FINITO</button>';
	document.getElementById('opzioni').style.display = 'none';
	document.getElementById('dettagli').style.display = 'block';
}

function info(){
	var dati = markerSelected.attributes;
	var dettagli = '';
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
	arrayDettagli.splice(1,0,'a metri ' + Math.round(dati.distanza,0) + '<br>');
	arrayDettagli.push('<span class="key">scadenza</span>: <span class="value">' + dati['scadenza'] + '</span>');
	dettagli += arrayDettagli.join('<br>');
	dettagli += '<br><input type="button" value="calcola percorso" style="width:250px; heigth:100px;" onclick="calcola_percorso();">';
	document.getElementById("dettagli").innerHTML = dettagli;
}

function accetta_raggio(){
	nascondi_div();
	DistanzaImpostata = distance;
	document.getElementById("distanza_menu").value = document.getElementById("meter").value;
	document.getElementById("distanza").style.display = "none";
}

function pulisci(){
	nascondi_div();
	destinazione_scelta = false;
	//markerSelected = ;
	for (g in gruppi){
		document.getElementById(g).className = 'notsel';
		var a = selectedGruppo.indexOf(g); 
		selectedGruppo.splice(a,1);
	}
	if (percorso_layer.features.length > 0){ percorso_layer.removeAllFeatures(); }
	document.getElementById('menu_dettagli').style.display = 'none';
	document.getElementById('menu_percorso').style.display = 'none';
	map.setCenter(posHere);
}