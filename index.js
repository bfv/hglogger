var i2c = require('i2c-bus');
var i2c1 = i2c.openSync(1);

var MPL3115A2_ADDR = 0x60;

function toCelsius(rawTemp) {
  var halfDegrees = ((rawTemp & 0xff) << 1) + (rawTemp >> 15);
 
  if ((halfDegrees & 0x100) === 0) {
    return halfDegrees / 2; // Temp +ve
  }
 
  return -((~halfDegrees & 0xff) / 2); // Temp -ve
}

function calcPressure(msb, csb, lsb) {
  var pressure;

  pressure = msb << 8;
  pressure += csb;
  pressure = pressure << 2;
  pressure += (lsb &  0xc0) >> 6;

  return pressure / 100;

}

(function() {
  i2c1.writeByteSync(0x60, 0x26, 0x38);
  i2c1.writeByteSync(0x60, 0x13, 0x07);
  i2c1.writeByteSync(0x60, 0x26, 0x39);

  while((i2c1.readByteSync(0x60, 0x00) & 0x08) === 0){}
  
  var p_msb = i2c1.readByteSync(0x60, 0x01);
  var p_csb = i2c1.readByteSync(0x60, 0x02);
  var p_lsb = i2c1.readByteSync(0x60, 0x03);

  var tempWord = i2c1.readWordSync(0x60, 0x04);
  
  /* console.log('pressure bytes:', p_msb, p_csb, p_lsb); */
  console.log('pressure', calcPressure(p_msb, p_csb, p_lsb), 'hPa');
  console.log('temp2:', toCelsius(tempWord) + '\u00B0' + 'C');

  i2c1.closeSync();

}());
