import React, { useEffect, useState } from "react";
import { Container, Col, Table, Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert, Row, Input, Label } from "reactstrap";
import { connect } from "react-redux";
import { setIdOrden } from '../../../actions/dashboardActions'
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { green } from '@material-ui/core/colors';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';


import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

  const Orden = (props) => {


  const [ordenes, setOrdenes] = useState([]);
  const [vacio, setVacio] = useState(0);

  let fecha = new Date();
  let date = fecha.getDate() < 10 ? ("0" + fecha.getDate()) : fecha.getDate();
  let month = fecha.getMonth() + 1;
  let year = fecha.getFullYear();
  fecha = (year + "-" + month + "-" + date)
  const [fechaFinal, setFechaFinal] = useState(localStorage.getItem("fechaFinal") || fecha);

  const deleteOrdenes = (id_sub, e) => {
    e.preventDefault();

    fetch(global.api.dashboard.deletesuborden, {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "x-api-key": "p7eENWbONjaDsXw5vF7r11iLGsEgKLuF9PBD6G4m"
      },
      body: JSON.stringify({
        id: id_sub,
      }),
    }
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error(err);
      });
    setModal(!modal);
    loadOrdenes();
  }

  const [modal, setModal] = useState(false);

  const toggle = () => {
    setModal(!modal);

  }
 
  const loadOrdenes = () => {
    fetch(
      global.api.dashboard.getordenes,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": "p7eENWbONjaDsXw5vF7r11iLGsEgKLuF9PBD6G4m",
        },
        body: JSON.stringify({
          fecha: localStorage.getItem("fechaFinal"),
        }),
      }
    )
      .then((response) => response.json())
      .then((result) => {
        setVacio(0)

        result[0].id_sub_orden === null ? setVacio(1) : setOrdenes(result)
        if (result[1].id_sub_orden != null) {
          setVacio(2)
          setOrdenes(result)
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const fechaChange = (e) => {
    setFechaFinal(e.target.value)
    localStorage.setItem("fechaFinal",e.target.value)
  }

  useEffect(() => {
  }, []);
  useEffect(() => {
    loadOrdenes();

  }, [localStorage.getItem("refresh")]);

  /* useEffect(() => {
    const interval = setInterval(() => {
      loadOrdenes()
    }, 6000);
    return () => clearInterval(interval);
  }, []); */

  useEffect(() => {
    loadOrdenes();
  }, [localStorage.getItem("fechaFinal")]);

  return (
    <div>
      <Row>
        <Col align="left">
          <div className="text-uppercase font-weight-bold title1orange ml-3 mt-1">Producción en línea</div>

        </Col>

        <Row>
          <Col className="mt-4 mr-0 "><div>Seleccione fecha</div></Col>
          <Col className="mt-3 mb-0 ml-0 mr-4">
            <Input
              type="date"
              name="tiempo"
              id="tiempo"
              value={localStorage.getItem("fechaFinal")}
              onChange={fechaChange}
            /></Col>
        </Row>

      </Row>
      <br />{vacio === 1 ?
        <Alert color="warning" className="mb-0">
          <a className="alert-link">No existen ordenes para mostrar</a>.
      </Alert> : ""}
      <Table striped className="mt-0">
        <thead className="theadBlue">
          <tr className="text-center">
            <th>Prioridad</th>
            <th>N° de Orden</th>
            <th>SKU</th>
            <th>Producto</th>
            <th>Cajas</th>
            <th>Productividad</th>
            <th>Tiempo</th>
            <th>Kg Solicitados</th>
            <th>Kg Producidos</th>
            <th>Kg %</th>
            <th>
              <CheckCircleOutlineIcon />
            </th>
            <th>
              <DeleteIcon />
            </th>

          </tr>
        </thead>
        <tbody>
          {/**PRUEBA COMMIT RAMA DAVID --> DEV */}
          {vacio === 1 ? <tr className="text-center">
            <td>---</td>
            <td>---</td>
            <td>---</td>
            <td>---</td>
            <td>---</td>
            <td>
              ---
              </td>
            <td>---</td>
            <td>---</td>
            <td>---</td>
            <td>
              ---
              </td>
            <td>
              <RadioButtonUncheckedIcon />
            </td>
            <td>
              <IconButton aria-label="delete" >
                <DeleteIcon />
              </IconButton>
            </td>

          </tr>

            : ordenes.map((orden, i) => (
              orden.id_sub_orden ?
                <tr className={orden.id_estado == 1 ? "orangeRow" : "text-center"}>
                  <td>{orden.prioridad}</td>
                  <td>{orden.id_sub_orden}</td>
                  <td>{orden.sku}</td>
                  <td>{orden.producto}</td>
                  <td>{orden.cajas}</td>
                  <td>
                    {Math.round(orden.productividad * 100) / 100 + " ham/min"}
                  </td>
                  <td>{Math.round(orden.tiempo_estimado * 100) / 100 + " hrs"}</td>
                  <td>{orden.kg_solicitados + " Kg"}</td>
                  <td>{orden.real_kg + " Kg"}</td>
                  <td>
                    {orden.kg_porcentual == null
                      ? "0 %"
                      : orden.kg_porcentual > 100
                        ? "100%"
                        : orden.kg_porcentual + " %"}
                  </td>
                  <td>
                    {orden.id_estado == 3 ? <CheckCircleIcon style={{ color: green[500] }} /> : <RadioButtonUncheckedIcon />}
                  </td>
                  <td>
                    <IconButton aria-label="delete" style={orden.id_estado == 1 ? { color: "#ffebee" } : {}} onClick={toggle}>
                      <DeleteIcon />
                    </IconButton>
                    <Modal isOpen={modal} toggle={toggle}>
                      <ModalHeader toggle={toggle}>{"Desea eliminar la orden n° " + orden.id_sub_orden}</ModalHeader>
                      <ModalBody>
                        <Container>
                          Sku: {orden.sku} <br />
                      Producto: {orden.producto} <br />
                      Cajas : {orden.cajas} <br />
                        </Container>
                      </ModalBody>
                      <ModalFooter>
                        <Button color="danger" onClick={(e) => deleteOrdenes(orden.id_sub_orden, e)}>Eliminar</Button>{' '}
                        <Button color="secondary" onClick={toggle}>Cancelar</Button>
                      </ModalFooter>
                    </Modal>
                  </td>

                </tr>
                : ""))}
        </tbody>
      </Table>

    </div>
  );
};

const mapStateToProps = (state) => ({
  id_orden: state.dashboardReducers.id_orden,
});

//export default MinimalDashboard1;
//export default connect(mapStateToProps,  mapDispatchToProps )(MinimalDashboard1);

const mapDispatchToProps = dispatch => ({

  setIdOrden: data => dispatch(setIdOrden(data)),

});

export default connect(mapStateToProps, mapDispatchToProps)(Orden);