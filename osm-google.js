var map;
var markerHere_layer;
var geolocate;
var overlay;

function init() {

    map = new OpenLayers.Map({
        div: "map"//,
        //projection: new OpenLayers.Projection("EPSG:900913")
    });
    
    var osm = new OpenLayers.Layer.OSM();            
    //var gmap = new OpenLayers.Layer.Google("Google Streets");
    
    map.addLayer(osm);//, gmap]);

    //map.addControl(new OpenLayers.Control.LayerSwitcher());
        var lon = 5;
        var lat = 40;
		var zoom = 5;
    map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
    /*map.setCenter(
        new OpenLayers.LonLat(10.2, 48.9).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 
        5
    );*/
	
// geolocate
	markerHere_layer = new OpenLayers.Layer.Vector('vector'); // layer per la sola posizione
	map.addLayer(markerHere_layer);
	geolocate = new OpenLayers.Control.Geolocate({
		bind: false,
		geolocationOptions: {
			enableHighAccuracy: false,
			maximumAge: 0,
			timeout: 7000
		}
	});
	map.addControl(geolocate);
	var firstGeolocation = true; // vedere poi se serve
	var style = {
		fillColor: '#000',
		fillOpacity: 0.1,
		strokeWidth: 0
	};
	geolocate.events.register("locationupdated",geolocate,function(e) {
		markerHere_layer.removeAllFeatures();
		markerHere_layer.addFeatures([
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
			)
		]);
		if (firstGeolocation) {
			map.zoomToExtent(markerHere_layer.getDataExtent());
			firstGeolocation = false;
			this.bind = true;
		}
	});
	geolocate.events.register("locationfailed",this,function() {
		//OpenLayers.Console.log('Location detection failed');
		alert('Ricerca posizione fallita');
	});

	carica_dati();
}

function carica_dati(){
//alert(data.type);
	var style = new OpenLayers.StyleMap({
		'default': OpenLayers.Util.applyDefaults(
			{label: "${l}", pointRadius: 10},
			OpenLayers.Feature.Vector.style["default"]
		),
		'select': OpenLayers.Util.applyDefaults(
			{pointRadius: 10},
			OpenLayers.Feature.Vector.style.select
		),
		//externalGraphic: '../img/marker.png', // icona da gruppo
		graphicWidth: 20,
		graphicHeight: 24,
		graphicYOffset: -24,
		title: ''	
	});

	var layerListeners = {
		featureclick: function(e) {
			alert(e.object.name + " says: " + e.feature.id + " clicked.");
			return false;
		},
		nofeatureclick: function(e) {
			alert(e.object.name + " says: No feature clicked.");
		}
	};

	//var geojson_format = new OpenLayers.Format.GeoJSON();

	//overlay = new OpenLayers.Layer.Vector();/*'Overlay', {
		//styleMap: style,
		//eventListeners: layerListeners
	//});*/
	//map.addLayer(overlay);
	//overlay.addFeatures(geojson_format.read(data));
	var geojson_format = new OpenLayers.Format.GeoJSON();
	var vector_layer = new OpenLayers.Layer.Vector({
		styleMap: style,
		eventListeners: layerListeners
	}); 
	map.addLayer(vector_layer);
	vector_layer.addFeatures(geojson_format.read(data));	

	var sf = new OpenLayers.Control.SelectFeature(vector_layer);
	sf.activate();
}

function localizzami(){
		markerHere_layer.removeAllFeatures();
		geolocate.deactivate();
		geolocate.watch = false;
		firstGeolocation = true;
		geolocate.activate();
/*
	var myLocation = new OpenLayers.Geometry.Point(10.2, 48.9)
			.transform('EPSG:4326', 'EPSG:3857');
*/

//	map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
}
