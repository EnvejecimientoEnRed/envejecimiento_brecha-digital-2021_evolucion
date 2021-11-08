import html2canvas from 'html2canvas';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { setRRSSLinks } from './rrss';
import 'url-search-params-polyfill';
import * as d3 from 'd3';

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let dataSources = [
    'https://raw.githubusercontent.com/EnvejecimientoEnRed/longevidad_edv-saludable_barras/main/data/ine_data.csv', 
    'https://raw.githubusercontent.com/EnvejecimientoEnRed/longevidad_edv-saludable_barras/main/data/echo_data.csv', 
    'https://raw.githubusercontent.com/EnvejecimientoEnRed/longevidad_edv-saludable_barras/main/data/renteria_data.csv',
    'https://raw.githubusercontent.com/EnvejecimientoEnRed/longevidad_edv-saludable_barras/main/data/renteria-ced_data.csv'
];
let tooltip = d3.select('#tooltip');

let ineData = [], echoData = [], echoDfleData = [], echoChrdfleData = [], renteriaData = [], renteriaCedData = [], currentData = [];
let subgrupoHombres = ['hombres_saludable','hombres_no_saludable'];
let subgrupoMujeres = ['mujeres_saludable','mujeres_no_saludable'];
let chartMenBlock = d3.select('#chartMen'), chartMen, xChartMen, xAxisChartMen, yChartMen, yAxisChartMen;
let chartWomenBlock = d3.select('#chartWomen'), chartWomen, xChartWomen, xAxisChartWomen, yChartWomen, yAxisChartWomen;
let margin = {top: 4, right: 5, bottom: 17.5, left: 22.5}, width, height;
let colors = ['#78bb6e','#6f0910'];

initData();

function initData() {
    let q = d3.queue();
    let csv = d3.dsvFormat(';');

    q.defer(d3.text, dataSources[0]);
    q.defer(d3.text, dataSources[1]);
    q.defer(d3.text, dataSources[2]);
    q.defer(d3.text, dataSources[3]);

    q.await(function(err, ine, echo, renteria, renteria_ced) {
        if (err) throw err;

        //INE
        ineData = csv.parse(ine);
        ineData = ineData.map(function(d) {
            return {
                'anio' : d.anio,
                'hombres_saludable' : +d.hombres_saludable.replace(',','.'),
                'hombres_no_saludable' : +d.hombres_total.replace(',','.') - +d.hombres_saludable.replace(',','.'),
                'mujeres_saludable' : +d.mujeres_saludable.replace(',','.'),
                'mujeres_no_saludable' : +d.mujeres_total.replace(',','.') - +d.mujeres_saludable.replace(',','.')
            }
        });
        
        //PAPER RENTERÍA
        renteriaData = csv.parse(renteria);
        renteriaData = renteriaData.map(function(d) {
            return {
                'anio' : d.anio,
                'hombres_saludable' : +d.hombres_sin.replace(',','.'),
                'hombres_no_saludable' : +d.hombres_con.replace(',','.'),
                'mujeres_saludable' : +d.mujeres_sin.replace(',','.'),
                'mujeres_no_saludable' : +d.mujeres_con.replace(',','.')
            }
        });

        //CED RENTERÍA
        renteriaCedData = csv.parse(renteria_ced);
        renteriaCedData = renteriaCedData.map(function(d) {
            return {
                'anio' : d.anio,
                'hombres_saludable' : +d.hombres_sin.replace(',','.'),
                'hombres_no_saludable' : +d.hombres_con.replace(',','.'),
                'mujeres_saludable' : +d.mujeres_sin.replace(',','.'),
                'mujeres_no_saludable' : +d.mujeres_con.replace(',','.')
            }
        });

        //Distinción para ECHO
        echoData = csv.parse(echo);
        echoDfleData[0] = { 
            'anio' : echoData[0]['anio'], 
            'hombres_no_saludable' :  +echoData[0]['hombres_con_dfle'].replace(',','.'), 
            'hombres_saludable' : +echoData[0]['hombres_sin_dfle'].replace(',','.'), 
            'mujeres_no_saludable' :  +echoData[0]['mujeres_con_dfle'].replace(',','.'), 
            'mujeres_saludable' : +echoData[0]['mujeres_sin_dfle'].replace(',','.')
        }
        echoDfleData[1] = { 
            'anio' : echoData[1]['anio'], 
            'hombres_no_saludable' :  +echoData[1]['hombres_con_dfle'].replace(',','.'), 
            'hombres_saludable' : +echoData[1]['hombres_sin_dfle'].replace(',','.'), 
            'mujeres_no_saludable' :  +echoData[1]['mujeres_con_dfle'].replace(',','.'), 
            'mujeres_saludable' : +echoData[1]['mujeres_sin_dfle'].replace(',','.')
        }

        echoChrdfleData[0] = { 
            'anio' : echoData[0]['anio'], 
            'hombres_no_saludable' :  +echoData[0]['hombres_con_chrdfle'].replace(',','.'), 
            'hombres_saludable' : +echoData[0]['hombres_sin_chrdfle'].replace(',','.'), 
            'mujeres_no_saludable' :  +echoData[0]['mujeres_con_chrdfle'].replace(',','.'), 
            'mujeres_saludable' : +echoData[0]['mujeres_sin_chrdfle'].replace(',','.')
        }
        echoChrdfleData[1] = { 
            'anio' : echoData[1]['anio'], 
            'hombres_no_saludable' :  +echoData[1]['hombres_con_chrdfle'].replace(',','.'), 
            'hombres_saludable' : +echoData[1]['hombres_sin_chrdfle'].replace(',','.'), 
            'mujeres_no_saludable' :  +echoData[1]['mujeres_con_chrdfle'].replace(',','.'), 
            'mujeres_saludable' : +echoData[1]['mujeres_sin_chrdfle'].replace(',','.')
        }

        //De primeras, mostramos los datos del INE
        initChart();

        setTimeout(() => {
            setChartCanvas();
        }, 5000);
    });    
}

function initChart() {
    width = parseInt(chartMenBlock.style('width')) - margin.left - margin.right - 5;
    height = parseInt(chartMenBlock.style('height')) - margin.top - margin.bottom;

    menChart(ineData);
    womenChart(ineData);   
}

function updateChart(tipo) {
    switch(tipo) {
        case 'ine':
            currentData = ineData.slice();
            break;
        case 'echo-dfle':
            currentData = echoDfleData.slice();
            break;
        case 'echo-chrdfle':
            currentData = echoChrdfleData.slice();
            break;
        case 'renteria-plos':
            currentData = renteriaData.slice();
            break;
        case 'renteria-ced':
            currentData = renteriaCedData.slice();
            break;
        default:
            currentData = ineData.slice();
            break;
    }

    //Borrado previo
    chartMenBlock.selectAll('*').remove();
    chartWomenBlock.selectAll('*').remove();

    //Disposición de nueva información
    menChart(currentData);
    womenChart(currentData);

    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

document.getElementById('replay').addEventListener('click', function() {
    updateChart(currentSelected);
});

//Helpers en visualización
function menChart(data) {
    ////// HOMBRES //////
    chartMen = chartMenBlock
        .append('svg')
        .lower()
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Eje X
    xChartMen = d3.scaleBand()
        .domain(data.map(function(d) { return d.anio; }))
        .range([0, width]);

    xAxisChartMen = function(g) {
        g.call(d3.axisBottom(xChartMen).tickValues(xChartMen.domain().filter(function(d,i){
            if(currentSelected == 'ine') {
                return !(i%3);
            } else {
                return !(i%1);
            }            
        })))
        //g.call(function(g){g.select('.domain').remove()});
    }

    chartMen.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxisChartMen);

    //Eje Y
    yChartMen = d3.scaleLinear()
        .domain([0,25])
        .range([height, 0]);

    yAxisChartMen = function(g) {
        g.call(d3.axisLeft(yChartMen).ticks(5));
    }

    chartMen.append("g")
        .call(yAxisChartMen);

    //SUBBLOQUES ANUALES
    let stackedMenData = d3.stack()
        .keys(subgrupoHombres)
        (data);

    chartMen.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedMenData)
        .enter()
        .append("g")
        .attr("fill", function(d) {
            if(d.index == 0) {
                return colors[0];
            } else {
                return colors[1];
            }
        })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr('class', function(d) { return 'bar hombres-' + d.data.anio; })
        .attr("x", function(d) { return xChartMen(d.data.anio) + xChartMen.bandwidth() / 4; })
        .attr("y", function(d) { return yChartMen(0); })
        .attr("width", xChartMen.bandwidth() / 2)
        .on('mouseover', function(d, i, e) {
            let total = d.data.hombres_saludable + d.data.hombres_no_saludable;

            let html = `<p class="chart__tooltip--title">${d.data.anio}</p>
                <p class="chart__tooltip--text">EdV total: ${total.toFixed(1).replace('.',',')} años</p>
                <p class="chart__tooltip--text">EdV en buena salud: ${d.data.hombres_saludable.toFixed(1).replace('.',',')} años</p>
                <p class="chart__tooltip--text">EdV con discapacidad y/o enfermedades: ${d.data.hombres_no_saludable.toFixed(1).replace('.',',')} años</p>`;

            tooltip.html(html);

            //Posibilidad visualización línea diferente
            let bars = d3.selectAll('.bar');
            let css = e[i].getAttribute('class').split(' ')[1];

            bars.each(function() {
                this.style.opacity = '0.4';
                if(this.getAttribute('class').indexOf(`${css}`) != -1) {
                    this.style.opacity = '1';
                }
            });

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);
        })
        .on('mouseout', function(d) {
            //Quitamos los estilos de la línea
            let bars = d3.selectAll('.bar');
            bars.each(function() {
                this.style.opacity = '1';
            });

            //Quitamos el tooltip
            getOutTooltip(tooltip); 
        })
        .transition()
        .duration(1500)
        .attr("y", function(d) { return yChartMen(d[1]); })
        .attr("height", function(d) { return yChartMen(d[0]) - yChartMen(d[1]); });
}

function womenChart(data) {
    ////// MUJERES //////
    chartWomen = chartWomenBlock
        .append('svg')
        .lower()
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Eje X
    xChartWomen = d3.scaleBand()
        .domain(data.map(function(d) { return d.anio; }))
        .range([0, width]);

    xAxisChartWomen = function(g) {
        g.call(d3.axisBottom(xChartWomen).tickValues(xChartWomen.domain().filter(function(d,i){
            if(currentSelected == 'ine') {
                return !(i%3);
            } else {
                return !(i%1);
            }
        })))
        //g.call(function(g){g.select('.domain').remove()});
    }

    chartWomen.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxisChartWomen);

    //Eje Y
    yChartWomen = d3.scaleLinear()
        .domain([0,25])
        .range([height, 0]);

    yAxisChartWomen = function(g) {
        g.call(d3.axisLeft(yChartWomen).ticks(5));
    }

    chartWomen.append("g")
        .call(yAxisChartWomen);

    //Datos
    let stackedWomenData = d3.stack()
        .keys(subgrupoMujeres)
        (data);

    chartWomen.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedWomenData)
        .enter()
        .append("g")
        .attr("fill", function(d) {
            if(d.index == 0) {
                return colors[0];
            } else {
                return colors[1];
            }
        })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr('class', function(d) { return 'bar mujeres-' + d.data.anio; })
        .attr("x", function(d) { return xChartWomen(d.data.anio) + xChartWomen.bandwidth() / 4; })
        .attr("y", function(d) { return yChartWomen(0); })
        .attr("width", xChartWomen.bandwidth() / 2)
        .on('mouseover', function(d, i, e) {
            //Texto
            let total = d.data.mujeres_saludable + d.data.mujeres_no_saludable;

            let html = `<p class="chart__tooltip--title">${d.data.anio}</p>
                <p class="chart__tooltip--text">EdV total: ${total.toFixed(1).replace('.',',')} años</p>
                <p class="chart__tooltip--text">EdV en buena salud: ${d.data.mujeres_saludable.toFixed(1).replace('.',',')} años</p>
                <p class="chart__tooltip--text">EdV con discapacidad y/o enfermedades: ${d.data.mujeres_no_saludable.toFixed(1).replace('.',',')} años</p>`;

            tooltip.html(html);

            //Posibilidad visualización línea diferente
            let bars = d3.selectAll('.bar');
            let css = e[i].getAttribute('class').split(' ')[1];

            bars.each(function() {
                this.style.opacity = '0.4';
                if(this.getAttribute('class').indexOf(`${css}`) != -1) {
                    this.style.opacity = '1';
                }
            });

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);
        })
        .on('mouseout', function(d) {
            //Quitamos los estilos de la línea
            let bars = d3.selectAll('.bar');
            bars.each(function() {
                this.style.opacity = '1';
            });

            //Quitamos el tooltip
            getOutTooltip(tooltip); 
        })
        .transition()
        .duration(1500)
        .attr("y", function(d) { return yChartWomen(d[1]); })
        .attr("height", function(d) { return yChartWomen(d[0]) - yChartWomen(d[1]); });
}

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
function getIframeParams() {
    const params = new URLSearchParams(window.location.search);
    const iframe = params.get('iframe');

    if(iframe == 'fijo') {
        setChartHeight('fijo');
    } else {
        setChartHeight();
    }
}

///Si viene desde iframe con altura fija, ejecutamos esta función. Si no, los altos son dinámicos a través de PYMJS
function setChartHeight(iframe_fijo) {
    if(iframe_fijo) {
        //El contenedor y el main reciben una altura fija
        //La altura del gráfico se ajusta más a lo disponible en el main, quitando títulos, lógica, ejes y pie de gráfico
        document.getElementsByClassName('container')[0].style.height = '612px';
        document.getElementsByClassName('main')[0].style.height = '580px';

        let titleBlock = document.getElementsByClassName('b-title')[0].clientHeight;
        let logicBlock = document.getElementsByClassName('chart__logics')[0].clientHeight;
        let footerBlock = document.getElementsByClassName('chart__footer')[0].clientHeight;
        let footerTop = 8, containerPadding = 8, marginTitle = 8, marginLogics = 12;

        //Comprobar previamente la altura que le demos al MAIN. El estado base es 588 pero podemos hacerlo más o menos alto en función de nuestros intereses

        let height = 580; //Altura total del main
        document.getElementsByClassName('chart__viz')[0].style.height = height - titleBlock - logicBlock - footerBlock - footerTop - containerPadding - marginTitle - marginLogics + 'px';
    } else {
        document.getElementsByClassName('main')[0].style.height = document.getElementsByClassName('main')[0].clientHeight + 'px';
    }    
}

getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let innerCanvas;
let pngDownload = document.getElementById('pngImage');

function setChartCanvas() {
    html2canvas(document.querySelector("#chartBlock"), {width: document.querySelector('#chartBlock').clientWidth, height: document.querySelector('#chartBlock').clientHeight, imageTimeout: 12000, useCORS: true}).then(canvas => { innerCanvas = canvas; });
}

function setChartCanvasImage() {    
    var image = innerCanvas.toDataURL();
    // Create a link
    var aDownloadLink = document.createElement('a');
    // Add the name of the file to the link
    aDownloadLink.download = 'longevidad_edv_saludable.png';
    // Attach the data to the link
    aDownloadLink.href = image;
    // Get the code to click the download link
    aDownloadLink.click();
}

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});

///// JUEGO DE PESTAÑAS /////
//Cambios de pestañas
let tabs = document.getElementsByClassName('tab');
let contenidos = document.getElementsByClassName('content');

for(let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function(e) {
        document.getElementsByClassName('main')[0].scrollIntoView();
        displayContainer(e.target);
    });
}

function displayContainer(elem) {
    let content = elem.getAttribute('data-target');

    //Poner activo el botón
    for(let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    elem.classList.add('active');

    //Activar el contenido
    for(let i = 0; i < contenidos.length; i++) {
        contenidos[i].classList.remove('active');
    }

    document.getElementsByClassName(content)[0].classList.add('active');
}

///// USO DE SELECTORES //////
let x, i, j, l, ll, selElmnt, a, b, c;
let currentSelected = 'ine';
/* Look for any elements with the class "custom-select": */
x = document.getElementsByClassName("custom-select");
l = x.length;
for (i = 0; i < l; i++) {
  selElmnt = x[i].getElementsByTagName("select")[0];
  ll = selElmnt.length;
  /* For each element, create a new DIV that will act as the selected item: */
  a = document.createElement("DIV");
  a.setAttribute("class", "select-selected");
  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
  x[i].appendChild(a);
  /* For each element, create a new DIV that will contain the option list: */
  b = document.createElement("DIV");
  b.setAttribute("class", "select-items select-hide");
  for (j = 1; j < ll; j++) {
    /* For each option in the original select element,
    create a new DIV that will act as an option item: */
    c = document.createElement("DIV");
    let valores = selElmnt.options[j].value.split("_");
    c.setAttribute('data-value', valores[0]);
    c.setAttribute('data-type', valores[1]);
    c.innerHTML = selElmnt.options[j].innerHTML;
    c.addEventListener("click", function(e) {
        /* When an item is clicked, update the original select box,
        and the selected item: */
        let y, i, k, s, h, sl, yl;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        sl = s.length;
        h = this.parentNode.previousSibling;
        currentSelected = e.target.getAttribute('data-value');   
        updateChart(currentSelected);

        for (i = 0; i < sl; i++) {
          if (s.options[i].innerHTML == this.innerHTML) {
            s.selectedIndex = i;
            h.innerHTML = this.innerHTML;
            y = this.parentNode.getElementsByClassName("same-as-selected");
            yl = y.length;
            for (k = 0; k < yl; k++) {
              y[k].removeAttribute("class");
            }
            this.setAttribute("class", "same-as-selected");
            break;
          }
        }
        h.click();
    });
    b.appendChild(c);
  }
  x[i].appendChild(b);
  a.addEventListener("click", function(e) {
    /* When the select box is clicked, close any other select boxes,
    and open/close the current select box: */
    e.stopPropagation();
    closeAllSelect(this);
    this.nextSibling.classList.toggle("select-hide");
    this.classList.toggle("select-arrow-active");
  });
}

function closeAllSelect(elmnt) {
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let x, y, i, xl, yl, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  xl = x.length;
  yl = y.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
}

/* If the user clicks anywhere outside the select box,
then close all select boxes: */
document.addEventListener("click", closeAllSelect);
