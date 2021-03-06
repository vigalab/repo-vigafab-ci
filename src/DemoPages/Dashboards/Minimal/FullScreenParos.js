import React, { useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { 
    Card, CardBody, Col, Container, InputGroup, Row, Dropdown, DropdownToggle, DropdownMenu,
    DropdownItem, Table, Progress, Pagination, PaginationItem, PaginationLink
} from "reactstrap";
import { Doughnut, Bar } from "react-chartjs-2";
import 'chartjs-plugin-datalabels';
import Circle from "react-circle";
import Brightness1Icon from "@material-ui/icons/Brightness1";

import _ from "lodash";
import moment from 'moment';

const FullScreenParos = (props) => {
    const [fecha, setFecha] = useState(props.date);
    const [confiabilidad, setConfiabilidad] = useState([]);

    const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
    const toggleMachine = () => setMachineDropdownOpen(!machineDropdownOpen);
    
    const [machineSelected, setMachineSelected] = useState("Línea Completa");
    const changeMachine = (e) => {
        setMachineSelected(e.currentTarget.textContent);
        toggleMachine();
    };

    /****************************************************/
    /* Obtención de datos generales de paro por máquina */
    /****************************************************/

    const [nombreProducto, setNombreProducto] = useState("Día Completo");
    const [tActivo, setTActivo] = useState(0);
    const [tNoJustificado, setTNoJustificado] = useState(0);
    const [tJustificado, setTJustificado] = useState(0);
    const [tExtra, setTExtra] = useState(0);

    const formatHour = (min) =>{
        let horas = parseInt(Math.trunc(min/60));
        let minutos = parseInt(min - (60*horas));
        return horas === 0 ? minutos + " Min" : horas + " Hrs, " + minutos + " Min";
    };

    const [dataTorta, setDataTorta] = useState(
        {
            legend: [
                {
                display: false,
                position: "top",
                fullWidth: true,
                reverse: true,
                },
            ],
            
            labels: [
                "Desconectado",
                "Paro sin Justificar",
                "Paro Justificado",
                "Producción",
            ],
            datasets: [
                {
                data: [4, 2, 1, 1],
                backgroundColor: [
                    "#d9d9d9", // gris
                    "#d92550", // rojo
                    "#f7b924", // amarillo
                    "#2264a7", // azul
                ],
                hoverBackgroundColor: [
                    "#d9d9d9", // gris
                    "#d92550", // rojo
                    "#f7b924", // amarillo
                    "#2264a7 ", // azul
                ],
                },
            ],
        }
    );

    /*********************************************/
    /* Obtención de datos detallados por máquina */
    /*********************************************/

    const [tiempoTotal, setTiempoTotal] = useState();
    const [tiempoOperativo, setTiempoOperativo] = useState();
    const [tiempoMantenimiento, setTiempoMantenimiento] = useState();

    const [detalleParos, setDetalleParos] = useState([]);
    const [detalleOperativos, setDetalleOperativos] = useState([]);
    const [detalleMantenimiento, setDetalleMantenimiento] = useState([]);

    const [queryParos, setQueryParos] = useState([]);

    const loadDetalleParo = () => {
        let m = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        m.toISOString();
        m.format();
    
        fetch(global.api.dashboard.getParosDia, {
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "x-api-key": "p7eENWbONjaDsXw5vF7r11iLGsEgKLuF9PBD6G4m"
          },
    
          body: JSON.stringify({
            fecha: props.date,
            sku: props.sku
          }),
        })
        .then(response => response.json())
        .then(result => {
            setQueryParos(result);
            setConfiabilidad(result.filter(dato => dato.id_tipo === -2));

            setNombreProducto(result[0].producto);
            
            var t_activo = 0, t_noJustificado = 0, t_justificado = 0, t_extra = 0;
            result.map(r => {
                if (r.id_tipo === 100)
                    t_activo += r.suma;
                else if (r.id_tipo === 99)
                    t_noJustificado += r.suma;
                else if (r.id_tipo === -1)
                    t_extra += r.suma;
                else
                    t_justificado += r.suma;
            });

            setTActivo(t_activo);
            setTNoJustificado(t_noJustificado);
            setTJustificado(t_justificado);
            if (t_extra > 0)
                setTExtra(t_extra);
            else
                setTExtra(0);

            let data = [0, t_noJustificado, t_justificado, t_activo]
            setDataTorta({
                datasets: [
                    {
                    data: data
                    }
                ],
            })

            var paros = [], operativos = [], mantenimiento = [];
            for (var i = 0; i < result.length; i++) {
                /* Se settea la información general de los paros */
                var found = false, pos = -1;
                for (var j = 0; j < paros.length; j++) {
                    if (result[i].vibot === paros[j].maquina && result[i].id_tipo === paros[j].id_tipo && result[i].turno === paros[j].turno) {
                        found = true; pos = j;
                        break;
                    }
                }
        
                if (found) {
                    paros[pos].suma += result[i].suma;
                } else {
                    var obj = {
                        maquina: result[i].vibot,
                        id_tipo: result[i].id_tipo,
                        suma: result[i].suma,
                        cantidad: result[i].cantidad,
                        nombre: result[i].nombre,
                        turno: result[i].turno
                    }
                    paros.push(obj);
                }
        
                /* Se settea el detalle de los operativos */
                if (result[i].nombre === "Operativo") {
                    found = false; pos = -1;
                    for (j = 0; j < operativos.length; j++) {
                        if (result[i].vibot === paros[j].maquina && result[i].ambito === operativos[j].ambito && result[i].turno === operativos[j].turno) {
                            found = true; pos = j;
                            break;
                        }
                    }
        
                    if (found) {
                        operativos[pos].suma += result[i].suma;
                    } else {
                        obj = {
                            maquina: result[i].vibot,
                            suma: result[i].suma,
                            cantidad: result[i].cantidad,
                            ambito: result[i].ambito,
                            turno: result[i].turno
                        }
                        operativos.push(obj);
                    }
                }
        
                /* Se settea el detalle de los de mantenimiento */
                if (result[i].nombre === "Mantenimiento") {
                    console.log(result[i].nombre);
                    found = false; pos = -1;
                    for (j = 0; j < mantenimiento.length; j++) {
                        if (result[i].vibot === paros[j].maquina && result[i].ambito === mantenimiento[j].ambito && result[i].turno === mantenimiento[j].turno) {
                            found = true; pos = j;
                            break;
                        }
                    }
            
                    if (found) {
                        mantenimiento[pos].suma += result[i].suma;
                    } else {
                        obj = {
                            maquina: result[i].vibot,
                            suma: result[i].suma,
                            cantidad: result[i].cantidad,
                            ambito: result[i].ambito,
                            turno: result[i].turno
                        }
                        mantenimiento.push(obj);
                    }
                }
            }
        
            paros.sort((a, b) => b.suma - a.suma);
            operativos.sort((a, b) => b.suma - a.suma);
            mantenimiento.sort((a, b) => b.suma - a.suma);
        
            setDetalleParos(paros);
            setDetalleOperativos(operativos);
            setDetalleMantenimiento(mantenimiento);
        
            let tiempo_total = 0, tiempo_operativo = 0, tiempo_mantenimiento = 0;
            paros.forEach(paro => {
                tiempo_total += paro.suma;
            });
            operativos.forEach(paro => {
                tiempo_operativo += paro.suma;
            });
            mantenimiento.forEach(paro => {
                tiempo_mantenimiento += paro.suma;
            });
        
            setTiempoTotal(tiempo_total);
            setTiempoOperativo(tiempo_operativo);
            setTiempoMantenimiento(tiempo_mantenimiento);
        })
        .catch(err => {
            console.error(err);
        });
    };

    useEffect(() => {
        if (props.confirmar !== 0){
            setFecha(props.date);
            loadDetalleParo();
        }
    }, [props.confirmar]);
    
    const [parosMaquina, setParosMaquina] = useState([]);
    const [operativosMaquina, setOperativosMaquina] = useState([]);
    const [mantenimientoMaquina, setMantenimientoMaquina] = useState([]);

    const [dataClasificacion, setDataClasificacion] = useState({});
    const [maxY, setMaxY] = useState(0);
    const [dataSum, setDataSum] = useState({});
    const [sumTotal, setSumTotal] = useState(0);

    const [parosVisibles, setParosVisibles] = useState([]);
    const [parosPage, setParosPage] = useState(0);

    const updateTable = (i) => {
        if (i !== parosPage){
            setParosPage(i);
            var copyParos = queryParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito);
            setParosVisibles(copyParos.sort((a, b) => b.suma - a.suma).slice((0+i*5), (5+i*5)));
        }
    };

    useEffect(() => {
        setParosPage(0); setParosVisibles([]);
        var paros = [], operativos = [], mantenimiento = [];
        var tiempoExtra = 0;

        if (machineSelected === "Línea Completa"){
            paros = detalleParos.filter(paro => paro.maquina !== "Envasadora 3");
            operativos = detalleOperativos;
            mantenimiento = detalleMantenimiento;

            paros.sort((a, b) => b.suma - a.suma);
            operativos.sort((a, b) => b.suma - a.suma);
            mantenimiento.sort((a, b) => b.suma - a.suma);
        } else{
            paros = detalleParos.filter(paro => paro.maquina === machineSelected);
            operativos = detalleOperativos.filter(paro => paro.maquina === machineSelected);
            mantenimiento = detalleMantenimiento.filter(paro => paro.maquina === machineSelected);
        }

        var t_activo = 0, t_noJustificado = 0, t_justificado = 0, t_extra = 0;
        paros.map(r => {
            if (r.id_tipo === 100)
                t_activo += r.suma;
            else if (r.id_tipo === 99)
                t_noJustificado += r.suma;
            else if (r.id_tipo === -1)
                t_extra += r.suma;
            else
                t_justificado += r.suma;
        });

        setTActivo(t_activo);
        setTNoJustificado(t_noJustificado);
        setTJustificado(t_justificado);
        
        if (t_extra > 0 && machineSelected !== "Línea Completa")
            setTExtra(t_extra);
        else if (t_extra > 0 && machineSelected === "Línea Completa")
            setTExtra(tiempoExtra);
        else
            setTExtra(0);

        let data = [0, t_noJustificado, t_justificado, t_activo]
        setDataTorta({
            legend: [
                {
                display: false,
                position: "top",
                fullWidth: true,
                reverse: true,
                },
            ],
            
            labels: [
                "Desconectado",
                "Paro sin Justificar",
                "Paro Justificado",
                "Producción",
            ],
            datasets: [
                {
                data: data,
                backgroundColor: [
                    "#d9d9d9", // gris
                    "#d92550", // rojo
                    "#f7b924", // amarillo
                    "#2264a7", // azul
                ],
                hoverBackgroundColor: [
                    "#d9d9d9", // gris
                    "#d92550", // rojo
                    "#f7b924", // amarillo
                    "#2264a7 ", // azul
                ],
                },
            ],
        });

        /* Se obtiene la suma de la cantidad de paros */
        var parosCount = {}, countList = [], labels = [], dataClass = [];
        paros.filter(paro => paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24).forEach(paro => {
            if (paro.nombre in parosCount)
                parosCount[paro.nombre] += paro.cantidad;
            else
                parosCount[paro.nombre] = paro.cantidad;
        });
        
        Object.keys(parosCount).map(paro => {
            countList.push({
                nombre: paro,
                cantidad: parosCount[paro]
            })
        });

        var max = 0;
        
        countList.sort((a, b) => b.cantidad - a.cantidad);
        countList.map(paro => {
            labels.push(paro.nombre);
            dataClass.push(paro.cantidad);

            if (paro.cantidad > max)
                max = paro.cantidad;
        });

        setMaxY(max);

        setDataClasificacion({
            labels: labels.slice(0, 3),
            datasets: [
                {
                    label: 'Cantidad de paros',
                    backgroundColor: ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", "#3D9970", "#111111", "#AAAAAA"],
                    data: dataClass.slice(0, 3)
                }
            ]
        });

        /* Se obtienen los tiempos perdidos según tipo de paro */
        var parosSum = {}, sumList = [], labels = [], dataSum = [], total = 0;
        paros.filter(paro => paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24).forEach(paro => {
            console.log(paro.nombre + ": " + paro.suma);
            if (paro.nombre in parosSum)
                parosSum[paro.nombre] += paro.suma;
            else
                parosSum[paro.nombre] = paro.suma;
        });
        
        Object.keys(parosSum).map(paro => {
            sumList.push({
                nombre: paro,
                suma: parosSum[paro]
            })
        });

        sumList.sort((a, b) => b.suma - a.suma);
        sumList.map(paro => {
            labels.push(paro.nombre);
            dataSum.push(paro.suma);
            total += paro.suma;
        });

        setSumTotal(total);
        setDataSum({
            labels: labels,
            datasets: [
                {
                    data: dataSum,
                    backgroundColor: ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", "#3D9970", "#111111", "#AAAAAA"],
                    hoverBackgroundColor: ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", "#3D9970", "#111111", "#AAAAAA"],
                },
            ],
        });
        
        setParosMaquina(paros.filter(paro => paro.id_tipo !== -1));
        setOperativosMaquina(operativos.filter(paro => paro.id_tipo !== -1));
        setMantenimientoMaquina(mantenimiento.filter(paro => paro.id_tipo !== -1));
    
        let tiempo_total = 0, tiempo_operativo = 0, tiempo_mantenimiento = 0;
        paros.filter(paro => paro.id_tipo !== -1).forEach(paro => {
            tiempo_total += paro.suma;
        });
        operativos.filter(paro => paro.id_tipo !== -1).forEach(paro => {
            tiempo_operativo += paro.suma;
        });
        mantenimiento.filter(paro => paro.id_tipo !== -1).forEach(paro => {
            tiempo_mantenimiento += paro.suma;
        });
    
        setTiempoTotal(tiempo_total);
        setTiempoOperativo(tiempo_operativo);
        setTiempoMantenimiento(tiempo_mantenimiento);

        var copyParos = queryParos;
        setParosVisibles(copyParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito).sort((a, b) => b.suma - a.suma).slice(0, 5));
    }, [detalleMantenimiento, machineSelected]);

    useEffect(() => {
        console.log(parosPage);
    }, [parosPage]);

    return (
        <FullScreen handle={props.handle} >
            <div className={props.handle.active ? "fullscreen-space" : "fullscreen-space d-none"} >
                {/* Cabecera de la vista */}
                <Row className="fullscreen-nav">
                    <Col style={{ alignSelf: 'center' }}>
                        <div className="app-header__logo2">
                            <div className="logo-src2" style={{ backgroundImage: `url(${localStorage.getItem("img")})`, marginTop: '0' }}/>
                        </div>
                    </Col>

                    <Col className="bigFont2" align="center" style={{ fontSize: '1.5rem', alignSelf: 'center' }}>
                        Tiempos perdidos para el día {moment(fecha).format('DD-MM-YYYY')} 
                    </Col>


                    <Col className="ml-4" style={{ alignSelf: 'center' }} align="right">
                        <div className="app-header__logo2">
                            <div className="logo-src2" style={{ 
                                backgroundImage: `url(https://vigalab.com/wp-content/uploads/2019/08/VIGAlab3-768x256.png)`, 
                                marginTop: '-2.5%', 
                                marginLeft: '10%',
                                backgroundPositionX: 'center',
                                height: '100%'
                            }}/>
                        </div>
                    </Col>
                </Row>

                {/* Selector de máquinas */}
                <br></br>
                <Row md="12" xl="12">
                    <Col md="3" xl="3" className="ml-5">
                        <Card className="main-card mb-3">
                            <CardBody>
                                <Container>
                                    <Row>
                                        <Col>
                                            <div className="titlecard">
                                                Filtros de búsqueda
                                                <hr></hr>
                                            </div>
                                            <InputGroup>
                                                <Col align="left" style={{ alignSelf: 'center' }}>
                                                    Máquina
                                                </Col>

                                                <Col align="right">
                                                    <Dropdown isOpen={machineDropdownOpen} toggle={toggleMachine}>
                                                        <DropdownToggle caret style={{ color: '#6c757d', backgroundColor: 'white' }}>
                                                            {machineSelected}
                                                        </DropdownToggle>
                                                        <DropdownMenu>
                                                            <DropdownItem header>Seleccione una máquina</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Formadora</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Envasadora 3</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Envasadora 4</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Envasadora 5</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Envasadora 6</DropdownItem>
                                                            <DropdownItem onClick={changeMachine}>Empaquetadora</DropdownItem>
                                                            <DropdownItem divider />
                                                            <DropdownItem onClick={changeMachine}>Línea Completa</DropdownItem>
                                                            {/*<DropdownItem onClick={changeMachine}>Línea Completa</DropdownItem>*/}
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </Col>
                                            </InputGroup>
                                            <br></br>
                                        </Col>
                                    </Row>
                                </Container>
                            </CardBody>
                        </Card>
                        
                        {machineSelected === "Línea Completa" ?
                            ""
                        :
                            <Card className="main-card">
                                <CardBody>
                                    <Container>
                                        <div align="center" className="text-uppercase font-weight-bold title1orange" style={
                                            props.sku === 0 ? { paddingTop: 0 }
                                            : { paddingTop: 0, fontSize: '14px' }
                                        }>
                                            {props.sku === 0 ?
                                                "Producción del día"
                                                : nombreProducto
                                            }
                                        </div>
                                        <Row className="mt-3 mb-2">
                                            <Col md="8" xl="8" className="ml-2">
                                                <Doughnut
                                                    id="1"
                                                    data={dataTorta}
                                                    width="8"
                                                    height="8"
                                                    align="center"
                                                    options={{
                                                        legend: {
                                                            display: false,
                                                        },
                                                        responsive: true,
                                                        maintainAspectRatio: true,
                                                        plotOptions: {
                                                            pie: {
                                                                donut: {
                                                                    size: '100%'
                                                                }
                                                            }
                                                        },
                                                        tooltips: {
                                                            callbacks: {
                                                                label: function(tooltipItem, data) {
                                                                    return data['labels'][tooltipItem['index']] + ': ' + 
                                                                        _.round(data['datasets'][0]['data'][tooltipItem['index']]/(tActivo+tJustificado+tNoJustificado), 2)*100 + '%';
                                                                }
                                                            }
                                                        },
                                                        plugins: {
                                                            datalabels: {
                                                            display: false,
                                                            color: 'white'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Col>
                                            <Col md="3" xl="3" className="ml-1" style={{ alignSelf: 'center' }}>
                                                <div className="circle mt-2">
                                                    <Circle
                                                        animate={true} // Boolean: Animated/Static progress
                                                        animationDuration="1s" // String: Length of animation
                                                        responsive={true} // Boolean: Make SVG adapt to parent size
                                                        size="100" // String: Defines the size of the circle.
                                                        lineWidth="40" // String: Defines the thickness of the circle's stroke.
                                                        progress={tActivo === 0 ? 0 : (_.round(tActivo/(tActivo+tJustificado+tNoJustificado), 2)*100).toFixed(0)} // String: Update to change the progress and percentage.
                                                        progressColor="#02c39a" // String: Color of "progress" portion of circle.
                                                        bgColor="#ecedf0" // String: Color of "empty" portion of circle.
                                                        textColor="#6b778c" // String: Color of percentage text color.
                                                        textStyle={{
                                                            fontSize: "5rem", // CSSProperties: Custom styling for percentage.
                                                        }}
                                                        percentSpacing={5} // Number: Adjust spacing of "%" symbol and number.
                                                        roundedStroke={true} // Boolean: Rounded/Flat line ends
                                                        showPercentage={true} // Boolean: Show/hide percentage.
                                                        showPercentageSymbol={true} // Boolean: Show/hide only the "%" symbol.
                                                    />
                                                    <div align="center" className="mt-2">Disp.</div>
                                                </div>
                                                
                                                <div className="circle mt-2">
                                                    <Circle
                                                        animate={true} // Boolean: Animated/Static progress
                                                        animationDuration="1s" // String: Length of animation
                                                        responsive={true} // Boolean: Make SVG adapt to parent size
                                                        size="100" // String: Defines the size of the circle.
                                                        lineWidth="40" // String: Defines the thickness of the circle's stroke.
                                                        progress={_.round(confiabilidad.length === 0 ? 0 : 
                                                            confiabilidad.find(maq => maq.vibot === machineSelected).suma*100 > 100 ? 100 :
                                                            confiabilidad.find(maq => maq.vibot === machineSelected).suma*100, 2).toFixed(0)
                                                        }// String: Update to change the progress and percentage.
                                                        progressColor="#02c39a" // String: Color of "progress" portion of circle.
                                                        bgColor="#ecedf0" // String: Color of "empty" portion of circle.
                                                        textColor="#6b778c" // String: Color of percentage text color.
                                                        textStyle={{
                                                            fontSize: "5rem", // CSSProperties: Custom styling for percentage.
                                                        }}
                                                        percentSpacing={5} // Number: Adjust spacing of "%" symbol and number.
                                                        roundedStroke={true} // Boolean: Rounded/Flat line ends
                                                        showPercentage={true} // Boolean: Show/hide percentage.
                                                        showPercentageSymbol={true} // Boolean: Show/hide only the "%" symbol.
                                                    />
                                                    <div align="center" className="mt-2">Conf.</div>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md="12" xl="12">
                                                <Row className="ml-2 mt-2">
                                                    <Brightness1Icon className="mr-2" style={{ color: "#2264a7" }} />
                                                    Tiempo Activo: <div className="ml-1" style={{ fontWeight: 'bold' }}>{formatHour(tActivo)}</div>
                                                </Row>
                                                <Row className="ml-2 my-1">
                                                    <Brightness1Icon className="mr-2" style={{ color: "#f7b924" }} />
                                                    Tiempo Justificado: <div className="ml-1" style={{ fontWeight: 'bold' }}>{formatHour(tJustificado)}</div>
                                                </Row>
                                                <Row className="ml-2 my-1">
                                                    <Brightness1Icon className="mr-2" style={{ color: "#d92550" }} />
                                                    Tiempo Sin Justificar: <div className="ml-1" style={{ fontWeight: 'bold' }}>{formatHour(tNoJustificado)}</div>
                                                </Row>
                                                <Row className="ml-2 my-1">
                                                    <Brightness1Icon className="mr-2" style={{ color: "#555" }} />
                                                    Tiempo Total: 
                                                    <div className="ml-1" style={{ fontWeight: 'bold' }}>
                                                        {formatHour(tActivo+tJustificado+tNoJustificado)}
                                                    </div>
                                                </Row>
                                            </Col>
                                        </Row>
                                        <hr></hr>
                                        <Row>
                                            <Col md="12" xl="12" align="center">
                                                <div className="font2Blue mt-2 mb-2">Tiempo extra de trabajo<br></br>(posterior a las 00:00 horas)</div>
                                                <div className="mt-2 mb-2" style={{ fontSize: 'xx-large', fontWeight: 'bolder' }}>{formatHour(tExtra)}</div>
                                            </Col>
                                        </Row>
                                    </Container>
                                </CardBody>
                            </Card>
                        }
                    </Col>
                    
                    {machineSelected === "Línea Completa" ?
                        <Col md="8" xl="8">
                            <Row>
                                <Col md="6" xl="6">
                                    <Card className="main-card mb-3">
                                        <CardBody>
                                            <Container>
                                                <div className="">
                                                    Clasificación de tiempos perdidos
                                                    <hr></hr>
                                                </div>
                                                <Row>
                                                    <Bar
                                                        data={dataClasificacion}
                                                        options={{
                                                            title:{
                                                                display:false,
                                                                fontSize: 20
                                                            },
                                                            legend:{
                                                                display: false,
                                                                position:'top'
                                                            },
                                                            type: 'bar',
                                                            scales: {
                                                                xAxes: [{
                                                                    gridLines: {
                                                                        display: false
                                                                    },
                                                                    ticks: {
                                                                        autoSkip: false,
                                                                        maxRotation: 0,
                                                                        minRotation: 0
                                                                    }
                                                                }],
                                                                yAxes: [{
                                                                    ticks: {
                                                                        suggestedMin: 0,
                                                                        suggestedMax: maxY
                                                                    },
                                                                    gridLines: {
                                                                        display: false
                                                                    }
                                                                }]
                                                            },
                                                            plugins: {
                                                                datalabels: {
                                                                    display: true,
                                                                    color: 'white'
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Row>
                                            </Container>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col md="6" xl="6">
                                    <Card className="main-card mb-3">
                                        <CardBody>
                                            <Container>
                                                <div className="">
                                                    Tiempos perdidos [min]
                                                    <hr></hr>
                                                </div>
                                                <Row>
                                                    <Doughnut
                                                        id="1"
                                                        data={dataSum}
                                                        width="8"
                                                        height="4"
                                                        align="center"
                                                        options={{
                                                            legend: {
                                                                display: true,
                                                                position: 'right'
                                                            },
                                                            responsive: true,
                                                            maintainAspectRatio: true,
                                                            plotOptions: {
                                                                pie: {
                                                                    donut: {
                                                                        size: '100%'
                                                                    }
                                                                }
                                                            },
                                                            tooltips: {
                                                                callbacks: {
                                                                label: function(tooltipItem, data) {
                                                                    return data['labels'][tooltipItem['index']] + ': ' + 
                                                                        _.round(data['datasets'][0]['data'][tooltipItem['index']]/(sumTotal), 2)*100 + '%';
                                                                }
                                                                }
                                                            },
                                                            plugins: {
                                                                datalabels: {
                                                                    display: true,
                                                                    color: 'white'
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Row>
                                            </Container>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    :
                        <Col md="8" xl="8" className="ml-4 mr-4">
                            <Card className="main-card mb-3">
                                <CardBody>
                                    <Container>
                                        <Row>
                                            {parosMaquina.length > 0 ?
                                                <Col xs="12">
                                                    Resumen
                                                    <Row className="mt-2">
                                                        <Col md="6" xl="6">
                                                            <div className="font2Blue">Turno A</div>
                                                            <Table size="sm" style={{marginTop: '1%'}}>
                                                                <tbody>
                                                                {
                                                                    parosMaquina.filter(paro => paro.turno === "A").map((paro, i) =>
                                                                    <tr key={i}>
                                                                        <td style={{ width: "45%", height: '2.5rem' }}>
                                                                            <Brightness1Icon className={
                                                                                paro.id_tipo === 100 ? "blue"
                                                                                : paro.id_tipo === 99 ? "red"
                                                                                : paro.nombre !== "Produciendo" && paro.nombre !== "Paro no justificado" && i === 0 ? "paro1"
                                                                                : i === 1 ? "paro2" : i === 2 ? "paro3"
                                                                                : i === 3 ? "paro4" : i === 4 ? "paro5"
                                                                                : i === 5 ? "paro6" : i === 6 ? "paro7"
                                                                                : i === 7 ? "paro8" : i === 8 ? "paro9"
                                                                                : i === 9 ? "paro10" : i === 10 ? "paro11"
                                                                                : i === 11 ? "paro12" : i === 12 ? "paro13"
                                                                                : i === 13 ? "paro14" : i === 14 ? "paro15"
                                                                                : i === 15 ? "paro16" : "gray"
                                                                            } 
                                                                            
                                                                            style={
                                                                                paro.id_tipo === 100 ? {marginRight: '2%', color: '#2264a7'} : 
                                                                                paro.id_tipo === 99 ? {marginRight: '2%', color: '#d92550'} :
                                                                                {marginRight: '2%' }
                                                                            }/>
                                                                            {
                                                                                paro.nombre.slice(0,1).toUpperCase() + paro.nombre.slice(1, paro.nombre.length)
                                                                            }
                                                                        </td>

                                                                        <td style={{ width: "27.5%" }}>
                                                                            <Progress
                                                                                value={paro.suma / tiempoTotal * 100}
                                                                                color={
                                                                                    paro.id_tipo === 100 ? "primary"
                                                                                    : paro.id_tipo === 99 ? "danger"
                                                                                    : paro.nombre !== "Produciendo" && paro.nombre !== "Paro no justificado" && i === 0 ? "paro1"
                                                                                    : i === 1 ? "paro2" : i === 2 ? "paro3"
                                                                                    : i === 3 ? "paro4" : i === 4 ? "paro5"
                                                                                    : i === 5 ? "paro6" : i === 6 ? "paro7"
                                                                                    : i === 7 ? "paro8" : i === 8 ? "paro9"
                                                                                    : i === 9 ? "paro10" : i === 10 ? "paro11"
                                                                                    : i === 11 ? "paro12" : i === 12 ? "paro13"
                                                                                    : i === 13 ? "paro14" : i === 14 ? "paro15"
                                                                                    : i === 15 ? "paro16" : "gray"
                                                                                } 
                                                                                max={100}
                                                                            />
                                                                        </td>
                                                                        <td style={{ width:'2.5%' }}></td>
                                                                        <td style={{ width: "25%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                    </tr>
                                                                    )
                                                                }
                                                                </tbody>
                                                            </Table>
                                                        </Col>

                                                        <Col md="6" xl="6">
                                                            <div className="font2Blue">Turno B</div>
                                                            <Table size="sm" style={{marginTop: '1%'}}>
                                                                <tbody>
                                                                {
                                                                    parosMaquina.filter(paro => paro.turno === "B").map((paro, i) =>
                                                                    <tr key={i}>
                                                                        <td style={{ width: "45%", height: '2.5rem' }}>
                                                                        <Brightness1Icon className={
                                                                            paro.id_tipo === 100 ? "blue"
                                                                            : paro.id_tipo === 99 ? "red"
                                                                            : paro.nombre !== "Produciendo" && paro.nombre !== "Paro no justificado" && i === 0 ? "paro1"
                                                                            : i === 1 ? "paro2" : i === 2 ? "paro3"
                                                                            : i === 3 ? "paro4" : i === 4 ? "paro5"
                                                                            : i === 5 ? "paro6" : i === 6 ? "paro7"
                                                                            : i === 7 ? "paro8" : i === 8 ? "paro9"
                                                                            : i === 9 ? "paro10" : i === 10 ? "paro11"
                                                                            : i === 11 ? "paro12" : i === 12 ? "paro13"
                                                                            : i === 13 ? "paro14" : i === 14 ? "paro15"
                                                                            : i === 15 ? "paro16" : "gray"
                                                                        } 
                                                                        
                                                                        style={
                                                                            paro.id_tipo === 100 ? {marginRight: '2%', color: '#2264a7'} : 
                                                                            paro.id_tipo === 99 ? {marginRight: '2%', color: '#d92550'} :
                                                                            {marginRight: '2%' }
                                                                        }/>
                                                                            {
                                                                                paro.nombre.slice(0,1).toUpperCase() + paro.nombre.slice(1, paro.nombre.length)
                                                                            }
                                                                        </td>

                                                                        <td style={{ width: "27.5%" }}>
                                                                        <Progress
                                                                            value={paro.suma / tiempoTotal * 100}
                                                                            color={
                                                                                paro.id_tipo === 100 ? "primary"
                                                                                : paro.id_tipo === 99 ? "danger"
                                                                                : paro.nombre !== "Produciendo" && paro.nombre !== "Paro no justificado" && i === 0 ? "paro1"
                                                                                : i === 1 ? "paro2" : i === 2 ? "paro3"
                                                                                : i === 3 ? "paro4" : i === 4 ? "paro5"
                                                                                : i === 5 ? "paro6" : i === 6 ? "paro7"
                                                                                : i === 7 ? "paro8" : i === 8 ? "paro9"
                                                                                : i === 9 ? "paro10" : i === 10 ? "paro11"
                                                                                : i === 11 ? "paro12" : i === 12 ? "paro13"
                                                                                : i === 13 ? "paro14" : i === 14 ? "paro15"
                                                                                : i === 15 ? "paro16" : "gray"
                                                                            } 
                                                                            max={100}
                                                                        />
                                                                        </td>
                                                                        <td style={{ width:'2.5%' }}></td>
                                                                        <td style={{ width: "25%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                    </tr>
                                                                    )
                                                                }
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                :
                                                <Col xs="12" >
                                                    Resumen
                                                    <Table size="sm" style={{marginTop: '1%'}}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ textAlign: '-webkit-center' }}><br></br>No hay paros registrados.</td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                        }
                                        </Row>
                                    </Container>
                                </CardBody>
                            </Card>
                            
                            <Card className="main-card mb-3">
                                <CardBody>
                                    <Container>
                                        <Row>
                                            {operativosMaquina.length > 0 ?
                                                <Col xs="12">
                                                    Paralizaciones Operativas
                                                    <Row className="mt-2">
                                                        <Col md="6" xl="6">
                                                            <div className="font2Blue">Turno A</div>
                                                            <Table size="sm" style={{marginTop: '1%'}}>
                                                                <tbody>
                                                                {
                                                                    operativosMaquina.filter(paro => paro.turno === "A").map((paro, i) =>
                                                                    <tr key={i}>
                                                                        <td style={{ width: "45%", height: '2.5rem' }}>
                                                                        <Brightness1Icon className={
                                                                            i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                            : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                            : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                            : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                            : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                            : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                            : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                            : i === 14 ? "paro15" : "paro16"} style={{marginRight: '5%'}} />
                                                                        {paro.ambito.slice(0,1).toUpperCase() + paro.ambito.slice(1, paro.ambito.length)}
                                                                        </td>

                                                                        <td style={{ width: "27.5%" }}>
                                                                            <Progress
                                                                                value={paro.suma / tiempoOperativo * 100}
                                                                                color={
                                                                                    i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                    : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                    : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                    : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                    : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                    : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                    : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                    : i === 14 ? "paro15" : "paro16"}
                                                                                max={100}
                                                                            />
                                                                        </td>
                                                                        <td style={{ width:'2.5%' }}></td>
                                                                        <td style={{ width: "25%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                    </tr>
                                                                    )
                                                                }
                                                                </tbody>
                                                            </Table>
                                                        </Col>

                                                        <Col md="6" xl="6">
                                                            <div className="font2Blue">Turno B</div>
                                                            <Table size="sm" style={{marginTop: '1%'}}>
                                                                <tbody>
                                                                {
                                                                    operativosMaquina.filter(paro => paro.turno === "B").map((paro, i) =>
                                                                    <tr key={i}>
                                                                        <td style={{ width: "45%", height: '2.5rem' }}>
                                                                        <Brightness1Icon className={
                                                                            i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                            : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                            : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                            : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                            : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                            : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                            : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                            : i === 14 ? "paro15" : "paro16"} style={{marginRight: '5%'}} />
                                                                        {paro.ambito.slice(0,1).toUpperCase() + paro.ambito.slice(1, paro.ambito.length)}
                                                                        </td>

                                                                        <td style={{ width: "27.5%" }}>
                                                                            <Progress
                                                                                value={paro.suma / tiempoOperativo * 100}
                                                                                color={
                                                                                    i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                    : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                    : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                    : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                    : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                    : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                    : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                    : i === 14 ? "paro15" : "paro16"}
                                                                                max={100}
                                                                            />
                                                                        </td>
                                                                        <td style={{ width:'2.5%' }}></td>
                                                                        <td style={{ width: "25%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                    </tr>
                                                                    )
                                                                }
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                : machineSelected === "Línea Completa" ? "" :
                                                <Col xs="12" >
                                                    Paralizaciones Operativas
                                                    <Table size="sm" style={{marginTop: '1%'}}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ textAlign: '-webkit-center' }}><br></br>No hay paros registrados.</td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            }
                                        </Row>
                                    </Container>
                                </CardBody>
                            </Card>

                            {machineSelected !== "Línea Completa" && mantenimientoMaquina.length !== 0 ?
                                <Card className="main-card mb-3">
                                    <CardBody>
                                        <Container>
                                            <Row>
                                                {mantenimientoMaquina.length > 0 ?
                                                    <Col xs="12">
                                                        Paralizaciones por Mantenimiento
                                                        <Row className="mt-2">
                                                            <Col md="6" xl="6">
                                                                <div className="font2Blue">Turno A</div>
                                                                <Table size="sm" style={{marginTop: '1%'}}>
                                                                    <tbody>
                                                                    {
                                                                        mantenimientoMaquina.filter(paro => paro.turno === "A").map((paro, i) =>
                                                                        <tr key={i}>
                                                                            <td style={{ width: "45%", height: '2.5rem' }}>
                                                                            <Brightness1Icon className={
                                                                                i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                : i === 14 ? "paro15" : "paro16"} style={{marginRight: '5%'}} />
                                                                            {paro.ambito.slice(0,1).toUpperCase() + paro.ambito.slice(1, paro.ambito.length)}
                                                                            </td>

                                                                            <td style={{ width: "27.5%" }}>
                                                                                <Progress
                                                                                    value={paro.suma / tiempoMantenimiento * 100}
                                                                                    color={
                                                                                    i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                : i === 14 ? "paro15" : "paro16"}
                                                                                    max={100}
                                                                                />
                                                                            </td>
                                                                            <td style={{ width:'2.5%' }}></td>
                                                                            <td style={{ width: "30%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                        </tr>
                                                                        )
                                                                    }
                                                                    </tbody>
                                                                </Table>
                                                            </Col>

                                                            <Col md="6" xl="6">
                                                                <div className="font2Blue">Turno B</div>
                                                                <Table size="sm" style={{marginTop: '1%'}}>
                                                                    <tbody>
                                                                    {
                                                                        mantenimientoMaquina.filter(paro => paro.turno === "B").map((paro, i) =>
                                                                        <tr key={i}>
                                                                            <td style={{ width: "45%", height: '2.5rem' }}>
                                                                            <Brightness1Icon className={
                                                                                i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                : i === 14 ? "paro15" : "paro16"} style={{marginRight: '5%'}} />
                                                                            {paro.ambito.slice(0,1).toUpperCase() + paro.ambito.slice(1, paro.ambito.length)}
                                                                            </td>

                                                                            <td style={{ width: "27.5%" }}>
                                                                                <Progress
                                                                                    value={paro.suma / tiempoMantenimiento * 100}
                                                                                    color={
                                                                                    i === 0 ? "paro1" : i === 1 ? "paro2"
                                                                                : i === 2 ? "paro3" : i === 3 ? "paro4"
                                                                                : i === 4 ? "paro5" : i === 5 ? "paro6"
                                                                                : i === 6 ? "paro7" : i === 7 ? "paro8"
                                                                                : i === 8 ? "paro9" : i === 9 ? "paro10"
                                                                                : i === 10 ? "paro11" : i === 11 ? "paro12"
                                                                                : i === 12 ? "paro13" : i === 13 ? "paro14"
                                                                                : i === 14 ? "paro15" : "paro16"}
                                                                                    max={100}
                                                                                />
                                                                            </td>
                                                                            <td style={{ width:'2.5%' }}></td>
                                                                            <td style={{ width: "25%", fontWeight: 'bold' }}>{formatHour(paro.suma)}</td>
                                                                        </tr>
                                                                        )
                                                                    }
                                                                    </tbody>
                                                                </Table>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    : ""
                                                }
                                            </Row>
                                        </Container>
                                    </CardBody>
                                </Card>
                            : ""
                            }
                        </Col>
                    }
                </Row>

                {machineSelected === "Línea Completa" ?
                    <Col md="11" xl="11"  className="ml-5">
                        <Card className="main-card mb-3">
                            <CardBody>
                                <Container>
                                    <div className="">
                                        Resumen de paralizaciones
                                        <hr></hr>
                                    </div>
                                    <Row>
                                        <Col>
                                            <Row>
                                                <Col md="12" xl="12">
                                                    <Table size="xl">
                                                        <thead className="theadBlue">
                                                            <tr className="text-center">
                                                                <th style={{ textAlignLast: 'center' }}>Turno</th>
                                                                <th style={{ textAlignLast: 'start' }}>Clasificación</th>
                                                                <th style={{ textAlignLast: 'start' }}>Motivo</th>
                                                                <th style={{ textAlignLast: 'start' }}>Máquina</th>
                                                                <th style={{ textAlignLast: 'center' }}>Minutos</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                        {
                                                            parosVisibles.sort((a, b) => b.suma - a.suma).map((paro, i) =>
                                                            <tr key={i}>
                                                                <td style={{ height: '2.5rem', fontWeight: '600', textAlignLast: 'center' }}>
                                                                    { paro.turno }
                                                                </td>
                                                                <td style={{ fontWeight: '600', textAlignLast: 'start' }} className="text-center">
                                                                    { paro.nombre }
                                                                </td>
                                                                <td style={{ fontWeight: '600', textAlignLast: 'start' }} className="text-center">
                                                                    { paro.ambito.charAt(0).toUpperCase() + paro.ambito.slice(1) }
                                                                </td>
                                                                <td style={{ fontWeight: '600', textAlignLast: 'start' }} className="text-center">
                                                                    { paro.vibot }
                                                                </td>
                                                                <td style={{ fontWeight: 'bold', textAlignLast: 'center' }} className="text-center">
                                                                    { paro.suma }
                                                                </td>
                                                            </tr>
                                                            )
                                                        }
                                                        </tbody>
                                                    </Table>

                                                </Col>
                                            </Row>

                                            <Row style={{ justifyContent: 'center' }}>
                                                <Pagination aria-label="Page navigation example">
                                                    <PaginationItem disabled={parosPage === 0} onClick={() => updateTable(0)}>
                                                        <PaginationLink first />
                                                    </PaginationItem>
                                                    <PaginationItem disabled={parosPage === 0} onClick={() => updateTable(parosPage-1)}>
                                                        <PaginationLink previous />
                                                    </PaginationItem>

                                                    {[...Array(_.round(queryParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito).length/5, 0))].map((e, i) => 
                                                        <PaginationItem key={i} active={parosPage === i}>
                                                            <PaginationLink onClick={() => updateTable(i)}>
                                                            {i+1}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )}
                                                    
                                                    <PaginationItem disabled={parosPage === _.round(queryParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito).length/5, 0)-1} onClick={() => updateTable(parosPage+1)}>
                                                        <PaginationLink next />
                                                    </PaginationItem>
                                                    <PaginationItem disabled={parosPage === _.round(queryParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito).length/5, 0)-1} onClick={() => updateTable(_.round(queryParos.filter(paro => paro.vibot !== "Envasadora 3" && paro.id_tipo !== -1 && paro.id_tipo !== 100 && paro.id_tipo !== -2 && paro.id_tipo !== 24 && paro.ambito).length/5, 0)-1)}>
                                                        <PaginationLink last />
                                                    </PaginationItem>
                                                </Pagination>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Container>
                            </CardBody>
                        </Card>
                    </Col>
                :
                    ""
                }
            </div>
        </FullScreen>
    );
}

export default FullScreenParos;