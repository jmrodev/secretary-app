EJEMPLO DE APLICACION CLIENTE DEL WSAA
======================================

Ejemplo de cliente del WSAA (webservice de autenticacion y autorizacion). 
Consume el metodo LoginCms ejecutando desde la Powershell de Windows. 
Muestra en stdout el login ticket response. 


REQUERIMIENTOS
--------------

- Microsoft Powershell
- OpenSSL


USO
---

```
   wsaa-cliente.ps1 
      [ -Certificado unCertificado ] 
      [ -ClavePrivada unaClavePrivada ]
      [ -ServicioId unIdServicio ]
      [ -OutXml unArchivoXml ]
      [ -OutCms unArchivoXmlFirmado ]
      [ -WsaaWsdl unaURL ]
``` 

   
EJEMPLOS
--------

```
   .\wsaa-cliente.ps1 -Certificado unCert.crt -ClavePrivada unaPriv.key -ServicioId wsfe
```


ACUERDO DE USO
--------------

1. El Departamento de Soporte Tecnico de la AFIP (DeSoTe/AFIP), pone a disposicion
el siguiente codigo para su utilizacion con el WebService de Autenticacion y Autorizacion (WSAA)
de la AFIP.

2. El mismo puede ser re-distribuido, publicado o descargado en forma total o parcial, ya sea
en forma electronica, mecanica u optica, sin requerir la autorizacion de DeSoTe/AFIP. 

3. DeSoTe/AFIP no asume ninguna responsabilidad de los errores que pueda contener el codigo ni la
obligacion de subsanar dichos errores o informar de la existencia de los mismos.

4. DeSoTe/AFIP no asume ninguna responsabilidad que surja de la utilizacion del codigo, ya sea por
utilizacion ilegal de patentes, perdida de beneficios, perdida de informacion o cualquier otro
inconveniente.

5. Bajo ninguna circunstancia DeSoTe/AFIP podra ser indicada como responsable por consecuencias y/o
incidentes ya sean directos o indirectos que puedan surgir de la utilizacion del codigo.

6. DeSoTe/AFIP no da ninguna garantia, expresa o implicita, de la utilidad del codigo, si el mismo es
correcto, o si cumple con los requerimientos de algun proposito en particular.

7. DeSoTe/AFIP puede realizar cambios en cualquier momento en el codigo sin previo aviso.

8. El codigo debera ser evaluado, verificado, corregido y/o adaptado por personal tecnico calificado
de las entidades que lo utilicen.

EL CODIGO FUENTE ES DISTRIBUIDO PARA EVALUACION, CON TODOS SUS ERRORES Y OMISIONES. LA
RESPONSABILIDAD DEL CORRECTO FUNCIONAMIENTO DEL MISMO YA SEA POR SI SOLO O COMO PARTE DE
OTRA APLICACION, QUEDA A CARGO DE LAS ENTIDADES QUE LO UTILICEN. LA UTILIZACION DEL CODIGO
SIGNIFICA LA ACEPTACION DE TODOS LOS TERMINOS Y CONDICIONES MENCIONADAS ANTERIORMENTE.
