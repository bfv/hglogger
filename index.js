var i2c = require('i2c-bus');
var i2c1 = i2c.openSync(1);

// device i2c address
const MPL3115A2_ADDR = 0x60;

// control register 1;
const CTRL_REG1 = 0x26;

// PT data configuration register address
const PT_DATA_CFG = 0x13;
const DREM = 0x04;   // raised data events
const PDEFE = 0x02;  // add pressure events
const TDEFE = 0x01;  // add temperature events

function toCelsius(rawTemp) {
  var halfDegrees = ((rawTemp & 0xff) << 1) + (rawTemp >> 15);

  if ((halfDegrees & 0x100) === 0) {
    return halfDegrees / 2; // Temp +ve
  }

  return -((~halfDegrees & 0xff) / 2); // Temp -ve
}

function calcPressure(msb, csb, lsb) {
  var pressure;

  // use msb, csb and bit 7&6 of lsb for integer part  (of Q18.2 fixed point)
  pressure = (((msb << 8) + csb) << 2) + ((lsb & 0b11000000) >> 6);

  // add fractional part, 2 bit => resolution = 0.25 Pa
  pressure += ((lsb & 0b00100000) >> 5) / 2;
  pressure += ((lsb & 0b00010000) >> 4) / 4;

  return pressure / 100;  // return hPa (millibar)
}

(function() {
  // standby, oversample ratio (OSR) 128 => min. sample time 512ms
  i2c1.writeByteSync(MPL3115A2_ADDR, CTRL_REG1, 0b00111000);
  i2c1.writeByteSync(MPL3115A2_ADDR, 0x13, DREM | PDEFE | TDEFE);
  // set active, OSR 128
  i2c1.writeByteSync(MPL3115A2_ADDR, CTRL_REG1, 0b00111001);

  while((i2c1.readByteSync(MPL3115A2_ADDR, 0x00) & 0x08) === 0){}

  var p_msb = i2c1.readByteSync(MPL3115A2_ADDR, 0x01);
  var p_csb = i2c1.readByteSync(MPL3115A2_ADDR, 0x02);
  var p_lsb = i2c1.readByteSync(MPL3115A2_ADDR, 0x03);

  var tempWord = i2c1.readWordSync(MPL3115A2_ADDR, 0x04);

  /* console.log('pressure bytes:', p_msb, p_csb, p_lsb); */
  console.log('pressure:', calcPressure(p_msb, p_csb, p_lsb).toFixed(4), 'hPa');
  console.log('temp:', toCelsius(tempWord) + '\u00B0' + 'C');

  i2c1.closeSync();

}());
