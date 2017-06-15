var target, observer, config;
//Map variables
var map, mapView;
var base_layer, grid_layer, reservoir_layer, all_streams_layer, selected_streams_layer, watershed_layer;
var toggle_layers;
var popup_div, popup_overlay;

//Chart variables
var nc_chart, seriesData, startDate, seriesDataGroup = [];

//jQuery handle variables
var btnLoadWatershed;
var popupLoadWatershed;

/**********************************
 ********Config & Geom dropdowns OnChange Event *********
 **********************************/

$('#config').on('change', function ()
{
    // disable "Forcing" in Geometry dropdown for long range
    if ($('#config').val() == 'long_range')
    {
        $("#geom option[value='forcing']").attr('disabled','disabled');
        if ($("#geom option:selected").val() == "forcing" ||  $("#geom").val()=="forcing")
        {
            $("#geom option[value='channel_rt']").attr("selected", "selected");
            $("#geom").val('channel_rt');
        }
    }
    else
    {
        $("#geom option[value='forcing']").removeAttr('disabled');
    }

    if ($('#config').val() === 'medium_range')
    {
        $('#endDate,#endDateLabel, #timeLag').addClass('hidden');
        _change_time_dropdown_content($('#config').val());
        $('#time').parent().removeClass('hidden');
        if ($('#geom').val() === 'channel_rt' && $('#config').val() !== 'long_range')
        {
            $('#velocVar').removeClass('hidden');
        }
    }
    else if ($('#config').val() === 'long_range')
    {
        $('#endDate,#endDateLabel,#velocVar').addClass('hidden');
        $('#time').parent().addClass('hidden');
        $('#timeLag').removeClass('hidden');
    }
    else if ($('#config').val() === 'short_range')
    {
        $('#endDate,#endDateLabel,#timeLag').addClass('hidden');
        _change_time_dropdown_content($('#config').val());
        $('#time').parent().removeClass('hidden');
        if ($('#geom').val() === 'channel_rt' && $('#config').val() !== 'long_range') {
            $('#velocVar').removeClass('hidden');
        };
    }
    else if ($('#config').val() === 'analysis_assim')
    {
        $('#endDate,#endDateLabel').removeClass('hidden');
        $('#time').parent().addClass('hidden');
        $('#timeLag').addClass('hidden');
        if ($('#geom').val() === 'channel_rt' && $('#config').val() !== 'long_range')
        {
            $('#velocVar').removeClass('hidden');
        }
    }
    $("#geom").trigger("change");
});

$('#geom').on('change', function ()
{
    // destroy existing popup
    $(popup_div).popover('destroy');

    // switch layer visibility
    toggle_layers.forEach(function(layer)
    {
        layer.setVisible($("#geom").val() === layer.get('keyword'));
    });

    if ($("#geom").val() == 'channel_rt')
    {
        selected_streams_layer.setVisible(true);
    }
    else if ($("#geom").val() == 'forcing')
    {
        grid_layer.setVisible(true);
    }

    // hide all variable options in variable dropdown list (display them later)
    $("#variable option").each(function()
    {
        $(this).addClass('hidden')
    });

    // hide and disable coordinate input
    $('#gridDiv').addClass('hidden');
    // hide and disable comid input
    $('#comidDiv').addClass('hidden');

    if ($('#geom').val() === 'channel_rt')
    {
        if (window.location.search.includes('channel_rt') && window.location.search.includes('long_range') === false)
        {
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('streamflow');
        }

        $('#comidDiv').removeClass('hidden');
        $('#comidInput').attr('disabled', false);
        $('#streamVar').removeClass('hidden');

        if ($('#config').val() !== 'long_range')
        {
            $('#velocVar').removeClass('hidden');
        }
    }
    else if ($('#geom').val() === 'reservoir')
    {
        if (window.location.search.includes('reservoir'))
        {
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('inflow');
        }
        $('#comidInput').attr('disabled', false);
        $('#comidDiv').removeClass('hidden');
        $('#infVar,#outfVar').removeClass('hidden');
    }
    else if ($('#geom').val() === 'land' && ($('#config').val() === 'short_range' ||
        $('#config').val() === 'analysis_assim'))
    {
        $('#gridDiv').removeClass('hidden');
        $('#gridInputY').attr('disabled', false);
        $('#gridInputX').attr('disabled', false);
        if (window.location.search.includes('land'))
        {
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('SNOWH');
        }
        $('#snowhVar,#sneqVar,#snowcVar,#etVar,#ssVar,#avsnowVar').removeClass('hidden');
    }
    else if ($('#geom').val() === 'land' && $('#config').val() === 'medium_range')
    {
        $('#gridDiv').removeClass('hidden');
        $('#gridInputY').attr('disabled', false);
        $('#gridInputX').attr('disabled', false);
        if (window.location.search.includes('land'))
        {
            // $('#variable').val(window.location.search.split("&")[2].substring(window.location.search.split("&")[2].
            //     lastIndexOf("variable=") + 9));
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('SNOWH');
        }
        $('#snowhVar,#sneqVar,#snowcVar,#etVar,#ssVar,#avsnowVar,#subrunoffVar,#evapVar,#canwVar,#soiltVar,#soilmVar').
        removeClass('hidden');
    }
    else if ($('#geom').val() === 'land' && $('#config').val() === 'long_range')
    {
        $('#gridDiv').removeClass('hidden');
        $('#gridInputY').attr('disabled', false);
        $('#gridInputX').attr('disabled', false);
        if (window.location.search.includes('land') && window.location.search.includes('long_range'))
        {
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('SNEQV');
        }
        $('#sneqVar,#etVar,#ssVar,#subrunoffVar,#runoffVar,#canwVar,#ssiVar').removeClass('hidden');
    }
    else if ($('#geom').val() === 'forcing' && $('#config').val() != 'long_range')
    {
        $('#gridDiv').removeClass('hidden');
        $('#gridInputY').attr('disabled', false);
        $('#gridInputX').attr('disabled', false);
        if (window.location.search.includes('forcing') && window.location.search.includes('analysis_assim'))
        {
            $('#variable').val(getUrlParameter('variable', null));
        }
        else
        {
            $('#variable').val('RAINRATE');
        }
        $('#rainrateVar').removeClass('hidden');
    }

});

function _change_time_dropdown_content(config)
{
    var newOptions;
    if (config=="short_range")
    {
          newOptions = {"00:00": "00",
                          "01:00": "01",
                          "02:00": "02",
                          "03:00": "03",
                          "04:00": "04",
                          "05:00": "05",
                          "06:00": "06",
                          "07:00": "07",
                          "08:00": "08",
                          "09:00": "09",
                          "10:00": "10",
                          "11:00": "11",
                          "12:00": "12",
                          "13:00": "13",
                          "14:00": "14",
                          "15:00": "15",
                          "16:00": "16",
                          "17:00": "17",
                          "18:00": "18",
                          "19:00": "19",
                          "20:00": "20",
                          "21:00": "21",
                          "22:00": "22",
                          "23:00": "23"};
    }
    else if (config=="medium_range")
    {
         newOptions = {"00:00": "00",
                          "06:00": "06",
                          "12:00": "12",
                          "18:00": "18"};
    }
    else
    {
        return ;
    }


    var $el = $("#time");
    var selected_value = $el.val();
    $el.empty(); // remove old options
    $.each(newOptions, function(key,value) {
        $el.append($("<option></option>")
        .attr("value", value).text(key));
    });
    $el.val(selected_value);
    if ($el.val() == null)
    {
        $el.val("00");
    }
}

/**********************************
 ********Init/Restore UI & Map *********
 **********************************/
$(document).ready(function ()
{
    if (!window.location.search.includes('?'))
    {
        $("#welcome-popup").modal("show");
    }

    // // force map to updateSize() once html structure changes
    // // select the target node
    // target = $('#app-content-wrapper')[0];
    // observer = new MutationObserver(function () {
    //     window.setTimeout(function () {
    //         if (map)
    //         {
    //              map.updateSize();
    //         }
    //     }, 350);
    // });
    // config = {attributes: true};
    // observer.observe(target, config);

    init_restore_ui_map();
});

function _switch_on_long_range_lag_toggle(lag_switch_on_list)
{
    // first turn off all lag switch
    $('#00z, #06z, #12z, #18z').attr('checked', false);
    $('#00z, #06z, #12z, #18z').parent().parent().removeClass('bootstrap-switch-on');
    $('#00z, #06z, #12z, #18z').parent().parent().addClass('bootstrap-switch-off');
    // turn on lag switch if it is in url
    for (var i = 0; i < lag_switch_on_list.length; i++)
    {
        var lag_sw_name = lag_switch_on_list[i];
        if (lag_sw_name[0] == "t")
        {
            lag_sw_name = lag_sw_name.substring(1, 4);
        }

        $('#' + lag_sw_name).attr('checked', true);
        $('#' + lag_sw_name).parent().parent().removeClass('bootstrap-switch-off');
        $('#' + lag_sw_name).parent().parent().addClass('bootstrap-switch-on');
    }
}

function init_restore_ui_map()
{
    //turns toggle navigation icon off
//    $(".toggle-nav").removeClass('toggle-nav');

    btnLoadWatershed = $('#btn-load-watershed');
    btnLoadWatershed.on('click', onClickLoadWatershed);
    // load watershed resource list from HS
    getHSWatershedList();
    popupLoadWatershed = $('#popup-load-watershed');

    $('[data-toggle="tooltip"]').tooltip();

    /**********************************
     **********INITIALIZE MAP *********
     **********************************/

    // show mouse position on map
    var mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(2),
            projection: 'EPSG:4326',
            className: 'custom-mouse-position',
            target: document.getElementById('mouse-position'),
            undefinedHTML: '&nbsp;'
        });

    map = new ol.Map({
        controls: ol.control.defaults({
            attributionOptions: ({
                collapsible: false
            })
        }).extend([mousePositionControl]),
        target: 'map-view',
        view: new ol.View({
            center: ol.proj.transform([-98, 38.5], 'EPSG:4326', 'EPSG:3857'),
            zoom: 4,
            minZoom: 2,
            maxZoom: 18,
            projection: 'EPSG:3857'
        })
    });

    mapView = map.getView();

    var qLong, qLat;

    // parse url query string to restore UI
    if (window.location.search.includes('?')) {
        var qConfig = getUrlParameter('config', null);
        $('#config').val(qConfig);
        // change options in 'time' dropdown according to config value
        _change_time_dropdown_content(qConfig);
        var qGeom = getUrlParameter('geom', null);
        $('#geom').val(qGeom);
        var qVar = getUrlParameter('variable', null);
        $('#variable').val(qVar);
        qLat = Number(getUrlParameter('lat', null));
        $('#latInput').val(qLat);
        qLong = Number(getUrlParameter('lon', null));
        $('#longInput').val(qLong);
        var qDate = getUrlParameter("startDate", null);
        $('#startDate').val(qDate);
        var qTime = getUrlParameter("time", null);
        $('#time').val(qTime);

        if (qGeom === 'channel_rt' || qGeom === 'reservoir') {
            var qCOMID = getUrlParameter('COMID', null);
            $('#comidInput').val(qCOMID);
        }
        else {
            var qCOMID = getUrlParameter("Y", null) + ',' + getUrlParameter("X", null);
            $('#gridInputY').val(qCOMID.split(',')[0]);
            $('#gridInputX').val(qCOMID.split(',')[1]);
        }
        var qDateEnd = getUrlParameter("endDate", null);
        $('#endDate').val(qDateEnd);

        var qLag = [];

        // turn on lag switch if it is in url
        var lag_switch_list = ["00z", "06z", "12z", "18z"];
        for (var i = 0; i < lag_switch_list.length; i++)
        {
            var lag_sw_name = lag_switch_list[i];
            if ("on" == getUrlParameter(lag_sw_name, null))
            {
                qLag.push('t' + lag_sw_name);
            }
        }
        _switch_on_long_range_lag_toggle(qLag);

        if (!_check_datetime_range($("#startDate").val(), $("#endDate").val(), null))
        {
            alert("Invalid start/end date");
        }

        // Retrieve timeseries data from backend
        initChart(qConfig, startDate, seriesData);
        get_netcdf_chart_data(qConfig, qGeom, qVar, qCOMID, qDate, qTime, qLag, qDateEnd);
    } //if (window.location.search.includes('?'))

    /**********************************
     ********INITIALIZE LAYERS*********
     **********************************/
    base_layer = new ol.layer.Tile({
        source: new ol.source.BingMaps({
            key: 'eLVu8tDRPeQqmBlKAjcw~82nOqZJe2EpKmqd-kQrSmg~AocUZ43djJ-hMBHQdYDyMbT-Enfsk0mtUIGws1WeDuOvjY4EXCH-9OK3edNLDgkc',
            imagerySet: 'AerialWithLabels'
        })
    });

    var grid_Source = new ol.source.TileWMS({
        url: 'https://geoserver.byu.edu/arcgis/services/NWM/grid/MapServer/WmsServer?',
        params: {
            LAYERS: "0"
        },
        crossOrigin: 'Anonymous' //This is necessary for CORS security in the browser
    });

    grid_layer = new ol.layer.Tile({
        source: grid_Source,
        maxResolution: 100,
        keyword: "land"
    });

    grid_layer.setOpacity(0.4);

    var reservoir_Source = new ol.source.TileWMS({
        url: 'https://geoserver.byu.edu/arcgis/services/NWM/reservoir/MapServer/WmsServer?',
        params: {
            LAYERS: "0"
        },
        crossOrigin: 'Anonymous' //This is necessary for CORS security in the browser
    });

    reservoir_layer = new ol.layer.Tile({
        source: reservoir_Source,
        keyword: "reservoir"
    });

    var all_streams_Source = new ol.source.TileWMS({
        url: 'https://geoserver.byu.edu/arcgis/services/NWM/nwm_channel_v10/MapServer/WmsServer?',
        params: {
            LAYERS: "0"
        },
        crossOrigin: 'Anonymous' //This is necessary for CORS security in the browser
    });

    all_streams_layer = new ol.layer.Tile({
        source: all_streams_Source,
        keyword: "channel_rt"
    });

    var createLineStyleFunction = function () {
        return function (feature, resolution) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffff00',
                    width: 3
                })
            });
            return [style];
        };
    };

    selected_streams_layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: createLineStyleFunction(),
        keyword: 'selected_streams_layer'
    });

    watershed_layer = new ol.layer.Vector(
        {
            source: new ol.source.Vector(),
            keyword: 'watershed_layer',
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 2
                }), fill: new ol.style.Fill({color: [255, 0, 255, 0.5]})
            })
        }
    );

    map.addLayer(base_layer);
    map.addLayer(watershed_layer);
    map.addLayer(grid_layer);
    map.addLayer(reservoir_layer);
    map.addLayer(all_streams_layer);
    map.addLayer(selected_streams_layer);

    toggle_layers = [grid_layer, reservoir_layer, all_streams_layer, selected_streams_layer];

    popup_div = document.getElementById('popup');
    popup_overlay = new ol.Overlay({
        element: popup_div,
        positioning: 'bottom-center',
        stopEvent: true
    });

    map.addOverlay(popup_overlay);
    map.on('singleclick', map_singleclick);
    map.on('pointermove', map_pointermove);

    // add watershed polygon to map
    var watershed_geojson_str = $("#watershed_geojson_str").val();
    var watershed_attributes_str = $("#watershed_attributes_str").val();
    if (watershed_geojson_str.length > 0)
    {
        addGeojsonLayerToMap(watershed_geojson_str, watershed_attributes_str, true);
    }

    var center_map_at_pnt_3857 = null;
    if (qLong && qLat)
    {
        if (parseFloat(qLong) != -98 && parseFloat(qLat) != 38.5 && qCOMID != "")
        {
            center_map_at_pnt_3857 = reproject_point(qLong, qLat, 4326, 3857);
        }
    }
    // highlight selected stream
    if (qCOMID && qGeom === 'channel_rt')
    {
        var stream_info = run_point_indexing_service_byu(qCOMID, null, null, 3857);
        if (stream_info != null)
        {
            selected_streams_layer.getSource().clear();
            selected_streams_layer.getSource().addFeature(stream_info.feature);
            center_map_at_pnt_3857 = stream_info.mid_point;
        }
    }
    if (center_map_at_pnt_3857)
    {
        CenterMap(center_map_at_pnt_3857[0], center_map_at_pnt_3857[1], 3857);
        mapView.setZoom(12);
    }
    $("#config").trigger("change");

    // if (qLong && qLat)
    // {
    //     var center_map_at_pnt_3857 = reproject_point(qLong, qLat, 4326, 3857);
    //     var evt_fake = {coordinate: center_map_at_pnt_3857};
    //     map_singleclick(evt_fake);
    // }

}

/****************************
 ***Map Event***
 ****************************/

function map_singleclick(evt)
{
    // destroy existing popup
    $(popup_div).popover('destroy');
    var view = map.getView();
    var viewResolution = view.getResolution();

    var displayContent = "<table>";
    var popup_point_3857;
    if (grid_layer.getVisible())
    {
        var grid_url = grid_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {
            'INFO_FORMAT': 'text/xml',
            'FEATURE_COUNT': 1
        });

        var grid_Data = dataCall(grid_url);
        var grid_Count = grid_Data.documentElement.childElementCount;

        if (grid_Count != 1)
        {
            return;
        }

        var south_north = grid_Data.documentElement.children[0].attributes['south_north'].value;
        var west_east = grid_Data.documentElement.children[0].attributes['west_east'].value;
        var lon = grid_Data.documentElement.children[0].attributes['XLONG_M'].value;
        var lat = grid_Data.documentElement.children[0].attributes['XLAT_M'].value;

        $("#gridInputY").val(south_north);
        $("#gridInputX").val(west_east);


        displayContent += '<tr><td>south_north: ' + south_north + '</td><td>west_east: ' + west_east + '</td></tr>';

        // popup shows at center of cell
        popup_point_3857 = reproject_point(lon, lat, 4326, 3857);

    }
    else if (reservoir_layer.getVisible())
    {
        var reservoir_url = reservoir_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {
            'INFO_FORMAT': 'text/xml',
            'FEATURE_COUNT': 1
        });

        var reservoir_Data = dataCall(reservoir_url);
        var reservoir_Count = reservoir_Data.documentElement.childElementCount;
        if (reservoir_Count != 1)
        {
            return;
        }

        var reservoirID = reservoir_Data.documentElement.children[0].attributes['lake_id'].value;
        var lon = reservoir_Data.documentElement.children[0].attributes['longitude'].value;
        var lat = reservoir_Data.documentElement.children[0].attributes['latitude'].value;

        $("#comidInput").val(reservoirID);

        displayContent += '<tr><td>Reservoir COMID: ' + reservoirID + '</td></tr>';

        // popup shows at reservoir point
        popup_point_3857 = reproject_point(lon, lat, 4326, 3857);

    }
    else if (all_streams_layer.getVisible())
    {
        // query stream info at point evt.coordinate in EPSG:3857
        var stream_info = run_point_indexing_service_byu(null, evt.coordinate, 3857, 3857);

        if (stream_info == null)
        {
            return ;
        }
        $("#comidInput").val(stream_info.comid);
        displayContent += '<tr><td>Stream COMID: ' + stream_info.comid + '</td></tr>';

        selected_streams_layer.getSource().clear();
        selected_streams_layer.getSource().addFeature(stream_info.feature);
        // popup shows at mid point of this stream
        popup_point_3857 = stream_info.mid_point;
    }
    else
    {
        return;
    }

    displayContent += '</table>';
    var lonlat = reproject_point(popup_point_3857[0], popup_point_3857[1], 3857, 4326);
    $('#longInput').val(lonlat[0]);
    $('#latInput').val(lonlat[1]);

    popup_overlay.setPosition(popup_point_3857);
    $(popup_div).popover({
        'placement': 'top',
        'html': true,
        'content': displayContent
    });

    $(popup_div).popover('show');
    $(popup_div).next().css('cursor', 'text');

    if (mapView.getZoom() < 12)
    {
        mapView.setZoom(12);
        CenterMap(lonlat[0], lonlat[1], 4326);
    }
}

function map_pointermove(evt)
{
    if (evt.dragging)
    {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var hit = map.forEachLayerAtPixel(pixel, function(layer)
    {
        if (layer != base_layer)
        {
            return true;
        }
    });
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
}

/****************************
 ***Popup Displaying Info***
 ****************************/
function dataCall(inputURL)
{
    var result = null;
    $.ajax({
        url: inputURL,
        async: false
    }).then(function(response) {
        result = response;
    });
    return result;
}

/****************************
 ***MAP VIEW FUNCTIONALITY***
 ****************************/
function reproject_point(X_lon, Y_lat, in_epsg, out_epsg)
{
    return ol.proj.transform([parseFloat(X_lon), parseFloat(Y_lat)], 'EPSG:' + in_epsg.toString(), 'EPSG:' + out_epsg.toString());
}

function CenterMap(X_lon, Y_lat, in_epsg)
{
    var pnt_3857 = [parseFloat(X_lon), parseFloat(Y_lat)];
    if (in_epsg != 3857)
    {
        pnt_3857 = reproject_point(X_lon, Y_lat, in_epsg, 3857);
    }

    mapView.setCenter(pnt_3857);
}

/****************************************
 *********EPA WMS FUNCTIONALITY**********
 ****************************************/

// EPA Functionality has been replaced by private WMS and WFS services hosted at BYU ArcServer
function run_point_indexing_service_byu(comid, pnt_coordinate, pnt_epsg, output_feature_epsg)
{
    // comid: station_id/comid of a stream
    // pnt_coordinate: [lon, lat] coordinate
    // pnt_epsg: epsg code of pnt_coordinate
    // output_feature_epsg: epsg code of the resulting stream openlayer feature obj
    // usage 1: give a comid, return its stream feature and mid point in output_feature_epsg projection
    // usage 2: give pnt_coordinate and pnt_epsg, find a closet stream and return its comid, stream feature and mid point

    if (comid == null)
    {
        var pnt_coordinate_3857 = pnt_coordinate;
        if (pnt_epsg != 3857)
        {
            pnt_coordinate_3857 = ol.proj.transform(pnt_coordinate, 'EPSG:' + pnt_epsg.toString(), 'EPSG:3857');
        }

        var view = map.getView();
        var viewResolution = view.getResolution();
        // WMS GetFeatureInfo request
        var stream_url = all_streams_layer.getSource().getGetFeatureInfoUrl(pnt_coordinate_3857, viewResolution, view.getProjection(), {
                        'INFO_FORMAT': 'text/xml',
                        'FEATURE_COUNT': 1
                    });

        var stream_Data = dataCall(stream_url);

        var reservoir_Count = stream_Data.documentElement.childElementCount;
        if (reservoir_Count < 1)
        {
            return null;
        }
        comid = stream_Data.documentElement.children[0].attributes['station_id'].value;
    }

    // WFS GetFeature request
    var wfs_query_url_template = "https://geoserver.byu.edu/arcgis/services/NWM/nwm_channel_v10/MapServer/WFSServer?service=WFS&request=GetFeature&version=1.1.0&typename=drew_nwm_channel_v10:channels_nwm_ioc&Filter=<ogc:Filter><ogc:PropertyIsEqualTo><ogc:PropertyName>station_id</ogc:PropertyName><ogc:Literal>#station_id#</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>";
    var wfs_query_url = wfs_query_url_template.replace("#station_id#", comid);
    var features_4269 = new ol.format.WFS().readFeatures(dataCall(wfs_query_url));
    if (features_4269.length < 1)
    {
        return null;
    }

    // get first feature
    var stream_feature = features_4269[0];
    stream_feature.setId(comid);
    if (output_feature_epsg != 4269)
    {
        stream_feature = new ol.Feature({
                                    geometry: stream_feature.getGeometry().clone().transform('EPSG:4269','EPSG:' + output_feature_epsg.toString()),
                                    id: comid
                                    })
    }

    // calculate mid point
    var pnt_num = stream_feature.getGeometry().getCoordinates()[0].length;
    var mid_index = Math.floor(pnt_num/2);
    // Note: the mid_pnt may be 3D - [X, Y, Z]
    var mid_pnt= stream_feature.getGeometry().getCoordinates()[0][mid_index];

    return {
            comid: comid,
            feature: stream_feature,
            mid_point: mid_pnt
           };
} //function run_point_indexing_service_byu()


/****************************************
 *******BUILD CHART FUNCTIONALITY********
 ****************************************/

function get_netcdf_chart_data(config, geom, variable, comid, date, time, lag, endDate)
{
    $.ajax({
        type: 'GET',
        url: 'get-netcdf-data/',
        dataType: 'json',
        data: {
            'config': config,
            'geom': geom,
            'variable': variable,
            'COMID': comid,
            'startDate': date,
            'time': time,
            'lag': lag.toString(),
            'endDate': endDate
        },
        error: function (jqXHR, textStatus, errorThrown)
        {
            $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the data</strong></p>');
            clearErrorSelection();
        },
        beforeSend: function ()
        {
            $('#info').html('<p class="alert alert-info" style="text-align: center"><strong>' +
                'Retrieving forecasts' + '</strong></p>').removeClass('hidden');
        },
        complete: function ()
        {
            setTimeout(function () {
                $('#info').addClass('hidden')
            }, 5000);
        },
        success: function (data)
        {
            if ("success" in data)
            {
                if ("ts_pairs_data" in data)
                {
                    var returned_tsPairsData = JSON.parse(data.ts_pairs_data);
                    //console.log(returned_tsPairsData);
                    for (var key in returned_tsPairsData)
                    {
                        if (returned_tsPairsData[key][2] === 'notLong')
                        {
                            var d = new Date(0);
                            startDate = d.setUTCSeconds(returned_tsPairsData[key][0]);
                            seriesData = returned_tsPairsData[key][1];
                            nc_chart.yAxis[0].setExtremes(null, null);
                            plotData(config, geom, variable, seriesData, startDate);
                        }
                        else
                        {
                            for (j = 0; j < returned_tsPairsData[key].length; j++)
                            {
                                var d = new Date(0);
                                var startDateG = d.setUTCSeconds(returned_tsPairsData[key][j][0]);
                                for (i = 1; i < returned_tsPairsData[key][j].length - 1; i++)
                                {
                                    var seriesDataTemp = returned_tsPairsData[key][j][i];
                                    var seriesDesc = 'Member 0' + String(i) + ' ' +
                                        returned_tsPairsData[key][j][returned_tsPairsData[key][j].length - 1];
                                    seriesDataGroup.push([seriesDataTemp, seriesDesc, startDateG]);
                                    nc_chart.yAxis[0].setExtremes(null, null);
                                    plotData(config, geom, variable, seriesDataTemp, startDateG, i - 1, seriesDesc);
                                }
                            } // for (j = 0;
                        } // else
                    } //for (var key i
                } //if ("ts_pairs_data" in data)
            }
            else if ("error" in data)
            {
                $('#nc-chart').addClass('hidden');
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>' + data['error'] + '</strong></p>').removeClass('hidden').addClass('error');

                // Hide error message 5 seconds after showing it
                setTimeout(function () {
                    $('#info').addClass('hidden')
                }, 5000);
            }
            else
            {
                viewer.entities.resumeEvents();
                $('#info').html('<p><strong>An unexplainable error occurred. Why? Who knows...</strong></p>').removeClass('hidden');
            }
            // The following line is important. It is to force map to re-calculate/re-calibrate itself since the plotting div may have changed size of map div
            map.updateSize();
        }
    });
}

function initChart(config, startDate)
{
    /****************************
     ******INITIALIZE CHART******
     ****************************/
    if (config !== 'long_range')
    {
        default_chart_settings = {
            title: {text: "NWM Forecast"},
            chart: {zoomType: 'x'},
            plotOptions: {
                series: {
                    color: '#0066ff',
                    marker: {
                        enabled: false
                    }
                },
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [[0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]]
                    },
                    marker: {radius: 2},
                    lineWidth: 1,
                    states: {
                        hover: {lineWidth: 1}
                    },
                    threshold: null
                }
            },
            xAxis: {
                type: 'datetime',
                title: {text: 'Time (UTC)'},
                minRange: 3600000,
                startDate: startDate
            },
            yAxis: {
                title: {text: 'Flow (cfs)'},
                min: 0
            },
            lang: {
                unitsKey: 'Switch between english and metric units'
            },
            exporting: {
                buttons: {
                    customButton: {
                        text: 'Change Units',
                        _titleKey: "unitsKey",
                        onclick: function () {
                            changeUnits(config)
                        }
                    }
                }
            }
        };

        $('#nc-chart').highcharts(default_chart_settings);
        nc_chart = $('#nc-chart').highcharts();
    }
    else
    {
        var default_chart_settings = {
            title: {text: "NWM Forecast"},
            chart: {zoomType: 'x'},
            plotOptions: {
                series: {
                    // color: '#0066ff',
                    marker: {
                        enabled: false
                    }
                }
            },
            xAxis: {
                type: 'datetime',
                title: {text: 'Time'},
                minRange: 14 * 3600000,
                min: startDate
            },
            yAxis: {
                title: {text: 'Flow (cfs)'},
                min: 0
            },
            lang: {
                unitsKey: 'Switch between english and metric units'
            },
            exporting: {
                buttons: {
                    customButton: {
                        text: 'Change Units',
                        _titleKey: "unitsKey",
                        onclick: function () {
                            changeUnits(config)
                        }
                    }
                }
            }
        };

        $('#nc-chart').highcharts(default_chart_settings);
        nc_chart = $('#nc-chart').highcharts();
    };
}

var plotData = function(config, geom, variable, data, start, colorIndex, seriesDesc)
{
    // if (config !== 'long_range')
    // {
        $('#actionBtns').removeClass('hidden');
    // }

    var calib = calibrateModel(config, geom, start);

    if (variable === 'streamflow' || variable === 'inflow' || variable === 'outflow')
    {
        var units = 'Flow (cfs)';
    }
    else if (variable === 'velocity')
    {
        var units = 'Velocity (ft/s)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'SNOWH')
    {
        var units = 'Snow Depth (Feet)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'SNEQV')
    {
        var units = 'Snow Water Equivalent (Feet)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'ACCET' || variable === 'ACCECAN' || variable === 'CANWAT' ||
        variable === 'UGDRNOFF' || variable === 'SFCRNOFF')
    {
        var units = 'Depth (Inches)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'FSNO')
    {
        var units = 'Snow Cover (Fraction)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'SOIL_M')
    {
        var units = 'Soil Moisture';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'SOILSAT_TOP' || variable === 'SOILSAT')
    {
        var units = 'Soil Saturation (Fraction)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'SNOWT_AVG' || variable === 'SOIL_T')
    {
        var units = 'Temperature (Kelvin)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }
    else if (variable === 'RAINRATE')
    {
        var units = 'Surface Precipitation Rate (in/hr)';
        nc_chart.yAxis[0].setTitle({text: units});
        $('tspan:contains("Change Units")').parent().parent().attr('hidden', true);
    }

    if (config !== 'long_range')
    {
        var data_series =
        {
            type: 'area',
            name: units,
            data: data,
            pointStart: calib['start'],
            pointInterval: calib['interval']
        };
        nc_chart.addSeries(data_series);
        if ($('#nc-chart').hasClass('hidden'))
        {
            $('#nc-chart').removeClass('hidden');
            $(window).resize();
        }
    }
    else
    {
        var data_series =
        {
            type: 'area',
            color: Highcharts.getOptions().colors[colorIndex],
            fillOpacity: 0.3,
            name: seriesDesc + ' ' + units,
            data: data,
            pointStart: start,
            pointInterval: calib['interval']
        };
        nc_chart.addSeries(data_series);
        if ($('#nc-chart').hasClass('hidden'))
        {
            $('#nc-chart').removeClass('hidden');
            $(window).resize();
        }
    } // else
}; //var plotData = function

function clearErrorSelection()
{
    var numFeatures = selected_streams_layer.getSource().getFeatures().length;
    var lastFeature = selected_streams_layer.getSource().getFeatures()[numFeatures-1];
    selected_streams_layer.getSource().removeFeature(lastFeature);
}

function changeUnits(config)
{
    if (config !== 'long_range') {
        var calib = calibrateModel(config, geom, startDate);
        if (nc_chart.yAxis[0].axisTitle.textStr === 'Flow (cfs)') {
            var newSeries = [];
            seriesData.forEach(function (i) {
                newSeries.push(i * 0.0283168);
            });

            nc_chart.series[0].remove();
            nc_chart.yAxis[0].setTitle({
                text: 'Flow (cms)'
            });
            var data_series = {
                type: 'area',
                name: 'Flow (cms)',
                data: newSeries,
                pointStart: calib['start'],
                pointInterval: calib['interval']
            };
            nc_chart.addSeries(data_series);
        } else {
            nc_chart.series[0].remove();
            nc_chart.yAxis[0].setTitle({text: 'Flow (cfs)'});
            var data_series = {
                type: 'area',
                name: 'Flow (cfs)',
                data: seriesData,
                pointStart: calib['start'],
                pointInterval: calib['interval']
            };
            nc_chart.addSeries(data_series);
        };
    } else {
        if (nc_chart.yAxis[0].axisTitle.textStr === 'Flow (cfs)') {
            while(nc_chart.series.length > 0) {
                nc_chart.series[0].remove(true);
            }
            nc_chart.yAxis[0].setTitle({text: 'Flow (cms)'});

            for (var i = 0; i < seriesDataGroup.length; i++) {
                var newSeries = [];
                seriesDataGroup[i][0].forEach(function (j) {
                    newSeries.push(j * 0.0283168);
                });
                var calib = calibrateModel(config, geom);
                var data_series = {
                    type: 'area',
                    name: seriesDataGroup[i][1] + ' Flow (cms)',
                    data: newSeries,
                    pointStart: seriesDataGroup[i][2],
                    pointInterval: calib['interval']
                };
                nc_chart.addSeries(data_series);
            }
        }
        else
        {
            while(nc_chart.series.length > 0)
            {
                nc_chart.series[0].remove(true);
            }
            nc_chart.yAxis[0].setTitle({text: 'Flow (cfs)'});

            for (var i = 0; i < seriesDataGroup.length; i++)
            {
                var calib = calibrateModel(config, geom);
                var data_series = {
                    type: 'area',
                    name: seriesDataGroup[i][1] + ' Flow (cfs)',
                    data: seriesDataGroup[i][0],
                    pointStart: seriesDataGroup[i][2],
                    pointInterval: calib['interval']
                };
                nc_chart.addSeries(data_series);
            }
        }
    }
}

function calibrateModel(config, geom, date)
{
    var interval;
    var start = date;
    if (config === 'short_range')
    {
        interval = 3600 * 1000; // one hour
    }
    else if (config === 'analysis_assim')
    {
        interval = 3600 * 1000; // one hour
    }
    else if (config === 'medium_range')
    {
        if(geom=='forcing')
        {
            interval = 3600 * 1000 * 1; // three hours
        }
        else 
        {
            interval = 3600 * 1000 * 3; // three hours
        }
    }
    else // long_range
    {
        if (geom != 'land')
        {
            interval = 3600 * 1000 * 6; // six hours
        }
        else
        {
            interval = 3600 * 1000 * 24; // 24 hours
        }
    }
    return {'interval': interval, 'start': start}
}

/****************************************
 *******Watershed Functionality********
 ****************************************/

function getHSWatershedList ()
{
    $.ajax({
        type: 'GET',
        url: 'get-hs-watershed-list',
        dataType: 'json',
        success: function (response) {
            var resources,
                resTableHtml = '<table id="tbl-watersheds"><thead><th></th><th>Title</th><th>File</th><th>Owner</th></thead><tbody>';

            if (response.hasOwnProperty('success')) {
                if (response.hasOwnProperty('resources')) {
                    resources = JSON.parse(response.resources);
                    if (resources.length === 0) {
                        popupLoadWatershed.find('.modal-body').html('<b>It appears that you do not own any HydroShare resource that can be imported as watershed.</b>');
                    }
                    else
                    {
                        resources.forEach(function (resource) {
                            resTableHtml += '<tr>' +
                                '<td><input type="radio" name="resource" class="rdo-res" data-filename="' + resource.filename + '" value="' + resource.id + '"></td>' +
                                '<td class="res_title">' + resource.title + '</td>' +
                                '<td class="res_title">' + resource.filename + '</td>' +
                                '<td class="res_title">' + resource.owner + '</td>' +
                                '</tr>';
                        });
                        resTableHtml += '</tbody></table>';
                        popupLoadWatershed.find('.modal-body').html(resTableHtml);
                        btnLoadWatershed
                            .removeClass('hidden')
                            .prop('disabled', false);
                    }
                }
            } else if (response.hasOwnProperty('error')) {
                popupLoadWatershed.find('.modal-body').html('<h6>' + response.error + '</h6>');
            }
        }
    });
}

function onClickLoadWatershed()
{
    btnLoadWatershed.prop('disabled', true);
    var $rdoRes = $('.rdo-res:checked');
    var resId = $rdoRes.val();
    var filename = $rdoRes.attr('data-filename');

    loadWatershed(resId, filename);
}

function loadWatershed(resId, filename)
{
    $.ajax({
        type: 'GET',
        url: 'load-watershed',
        dataType: 'json',
        data: {
            res_id: resId,
            filename: filename
        },
        error: function () {
            console.error('Failed to load watershed!');
        },
        success: function (ajax_resp) {
            if (ajax_resp.hasOwnProperty('success'))
            {
                addGeojsonLayerToMap(ajax_resp.watershed.geojson_str, JSON.stringify(ajax_resp.watershed.attributes), true);
                popupLoadWatershed.modal('hide');
            }
            else
            {
                alert(ajax_resp.error);
            }
            btnLoadWatershed.prop('disabled', false);
        }
    });
}

function addGeojsonLayerToMap(geojsonStr, attributeStr, zoomTo)
{
    //geojsonStr = geojsonStr.replace(/&quot;/g, '"'); // Unencode the encoded double-quotes
    //attributeStr = attributeStr.replace(/&quot;/g, '"'); // Unencode the encoded double-quotes

    var geoJson = JSON.parse(geojsonStr);
    var attributeJson = JSON.parse(attributeStr);

    watershed_layer.getSource().clear();

    // this geojson obj is the "Geometry" part (Polygon) of a geojson, not FeatureCollection or others
    var geometry = new ol.format.GeoJSON().readGeometry(geoJson);
    var fea = new ol.Feature(
        {
            geometry: geometry
        });
    fea.setProperties(attributeJson);
    watershed_layer.getSource().addFeature(fea);

    if (zoomTo)
    {
        mapView.fit(watershed_layer.getSource().getExtent(), map.getSize());
    }
    // $('#watershed_attributes_str').val(attributeStr);
    // $("#watershed_geojson_str").val(geojsonStr);
}

// see: https://davidwalsh.name/query-string-javascript
function getUrlParameter(name, url)
{
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    if (url === null)
    {
        var results = regex.exec(location.search);
    }
    else
    {
        var results = regex.exec(url);
    }

    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/****************************************
 *******Sebset Watershed Functionality********
 ****************************************/

$("#subsetBtn").on("click", function()
{
    var watershed_fea_list = watershed_layer.getSource().getFeatures();
    if (watershed_fea_list.length != 1)
    {
        alert("no watershed loaded");
        return;
    }
    $("#subsetBtn, #watershedBtn, #submitBtn").attr('disabled','disabled');
    if ($("#chkbox-upload-subset-to-hs").prop('checked'))
    {
        if ($("#config").val() != "analysis_assim")
        {

            var time_str = $("#startDate").val() + "@" + $("#time option:selected").text();
        }
        else
        {
            var time_str = $("#startDate").val() + " to " + $("#endDate").val();
        }
        var config_str = $("#config option:selected").text();
        var geometry_str = $("#geom option:selected").text();
        var res_title_str = watershed_fea_list[0].getProperties().title;

        var replace_dict = {};
        replace_dict["#time#"]=time_str;
        replace_dict["#config#"]=config_str;
        replace_dict["#geometry#"]=geometry_str;
        replace_dict["#res_titile#"]=res_title_str;

        var res_title_template = "NWM subset: #time# #config# #geometry# files for region - #res_titile#";
        var res_title = _render_str_template(res_title_template, replace_dict);
        $('#resource-title-subset').val(res_title);

        var abstract_template = "A subset of NWM data for region #res_titile#: " +
            "Model Configuration: #config#; " +
            "Geometry: #geometry#; " +
            "Date time/range: #time#; ";

        var res_abstract = _render_str_template(abstract_template, replace_dict);
        $('#resource-abstract-subset').val(res_abstract);

        var keywords_template = "NWM, subset, #time#, #config#, #geometry#";
        var res_keywords = _render_str_template(keywords_template, replace_dict);
        $('#resource-keywords-subset').val(res_keywords);

        $('#display-status-subset').empty().removeClass("success error uploading");

        $('#hydroshare-subset').modal('show');
        return;
    }

    subset_watershed_download();
}); //$("#subsetBtn").on("click", function()

function _render_str_template(template_str, replace_dict)
{
    var str = template_str;
    for(var key in replace_dict)
    {
        var value = replace_dict[key];
        str = str.replace(key, value);
    }
    return str;
}

function _prepare_watershed_data()
{
    // check watershed_layer has a feature
    var watershed_fea_list = watershed_layer.getSource().getFeatures();
    if (watershed_fea_list.length == 0)
    {
        alert("no watershed loaded");
        return;
    }

    var merge_netcdf = false;
    if ($('#chkbox-subset-merge').prop('checked'))
    {
        merge_netcdf = true;
    }
    url = $('#paramForm').serialize();
    // function getUrlParameter() requires a valid url: http + domain + query string
    // make a fake url
    url = "http://www.hydroshare.org/?" + url;
    var parameter = {
        config: getUrlParameter("config", url),
        geom: getUrlParameter("geom", url),
        variable: getUrlParameter("variable", url),
        startDate: getUrlParameter("startDate", url),
        endDate: getUrlParameter("endDate", url),
        time: getUrlParameter("time", url),
        lag_00z: getUrlParameter("00z", url),
        lag_06z: getUrlParameter("06z", url),
        lag_12z: getUrlParameter("12z", url),
        lag_18z: getUrlParameter("18z",url),
        merge: merge_netcdf
    };

    // analysis_assim date range no more than 3 days
    if (parameter.config == "analysis_assim")
    {
        if (!_check_datetime_range($("#startDate").val(), $("#endDate").val(), 3))
        {
            alert("Invalid start/end date; You may subset Analysis & Assimilation data for 3 days or less");
            $("#subsetBtn, #watershedBtn, #submitBtn").removeAttr('disabled');
            return;
        }
    }

    var watershed_fea = watershed_fea_list[0];
    if (watershed_fea.getGeometry().getType().toLowerCase() != "polygon")
    {
        alert("not a polygon");
    }
    var geoJSON = new ol.format.GeoJSON();
    var geom_json = geoJSON.writeGeometry(watershed_fea.getGeometry());

    var data = {watershed_geometry: geom_json, watershed_epsg: 3857, subset_parameter: parameter};
    return data
}

function subset_watershed_hydroshare()
{
    var data = _prepare_watershed_data();
    var hydroshare_data = {"title": $('#resource-title-subset').val(),
        "abstract": $('#resource-abstract-subset').val(),
        "keywords": $('#resource-keywords-subset').val(),
        "res_type": $('#resource-type-subset').val()
    };
    data["hydroshare"] = hydroshare_data;

    var displayStatus = $('#display-status-subset');
    displayStatus.removeClass('error');
    displayStatus.addClass('uploading');
    displayStatus.html('<em>Uploading...</em>');

     if (hydroshare_data.title.length==0 || hydroshare_data.keywords.length==0 || hydroshare_data.abstract.length==0)
     {
            displayStatus.removeClass('uploading');
            displayStatus.addClass('error');
            displayStatus.html('<em>All metadata information should be provided.</em>');
            return;
     }

    $('#hydroshare-proceed-subset').prop('disabled', true);
    var csrf_token = getCookie('csrftoken');

    $.ajax({
        type: 'POST',
        url: '/apps/nwm-forecasts/subset-watershed/',
        headers: {'X-CSRFToken': csrf_token},
        dataType: 'json',
        data: JSON.stringify(data),
        success: function (data) {
            $('#hydroshare-proceed-subset').prop('disabled', false);
            if (data.status == "success")
            {
                 displayStatus.removeClass('uploading');
                 displayStatus.addClass('success');
                 displayStatus.html('<em>' + data.status.toUpperCase() + ' View in HydroShare <a href="https://www.hydroshare.org/resource/' + data.res_id +
                  '" target="_blank" style="color:red">HERE</a></em>');
            }
            else
            {
                displayStatus.removeClass('uploading');
                displayStatus.addClass('error');
                displayStatus.html('<em>' + data.msg + '</em>');
            }
            $("#subsetBtn, #watershedBtn, #submitBtn").removeAttr('disabled');
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('#hydroshare-proceed-subset').prop('disabled', false);
            displayStatus.removeClass('uploading');
            displayStatus.addClass('error');
            displayStatus.html('<em>' + errorThrown + '</em>');
            $("#subsetBtn, #watershedBtn, #submitBtn").removeAttr('disabled');
        }
    });

}

function subset_watershed_download()
{
    var data = _prepare_watershed_data();

    //http://stackoverflow.com/questions/28165424/download-file-via-jquery-ajax-post
    // Use XMLHttpRequest instead of Jquery $ajax
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        var a;
        if (xhttp.readyState === 4 && xhttp.status === 200)
        {
            // Trick for making downloadable link
            a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhttp.response);
            // Give filename you wish to download
            a.download = "NWM_subset.zip";
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            $("#subsetBtn, #watershedBtn, #submitBtn").removeAttr('disabled');
        }
        else if  (xhttp.status != 200 && xhttp.status != 0)
        {
            xhttp.abort();
            alert("Failed to subset this watershed");
            $("#subsetBtn, #watershedBtn, #submitBtn").removeAttr('disabled');
        }

    }; //xhttp.onreadystatechange
    // Post data to URL which handles post request
    xhttp.open("POST", 'subset-watershed/');
    xhttp.setRequestHeader("Content-Type", "application/json");
    var csrf_token = getCookie('csrftoken');
    xhttp.setRequestHeader("X-CSRFToken", csrf_token);
    // You should set responseType as blob for binary responses
    xhttp.responseType = 'blob';
    xhttp.send(JSON.stringify(data));
}

function _check_datetime_range(startDate, endDate, delta_days)
{
    var startDate_obj = new Date();
    startDate_obj.setUTCFullYear(startDate.split("-")[0]);
    startDate_obj.setUTCMonth(parseInt(startDate.split("-")[1])-1);
    startDate_obj.setUTCDate(startDate.split("-")[2]);

    var endDate_obj = new Date();
    endDate_obj.setUTCFullYear(endDate.split("-")[0]);
    endDate_obj.setUTCMonth(parseInt(endDate.split("-")[1])-1);
    endDate_obj.setUTCDate(endDate.split("-")[2]);

    if (startDate_obj.getTime() > endDate_obj.getTime())
    {
        return false;
    }

    if (Number.isInteger(delta_days))
    {
        startDate_obj.setDate(startDate_obj.getDate() + delta_days);
        if (startDate_obj.getTime() <= endDate_obj.getTime())
        {
            return false;
        }
    }

    return true;
}

function getCookie(name)
{
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
