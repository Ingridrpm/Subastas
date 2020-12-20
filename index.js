const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const db = require('./database')
const bodyParser = require('body-parser');
app.use(bodyParser.json({
    limit: '10mb',
    extended: true
}));
var cors = require('cors');
app.use(cors());
var schedule = require('node-schedule');
var nodemailer = require('nodemailer');
const { builtinModules } = require('module');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'econoahorro@gmail.com',
        pass: 'proyectosa'
    }
});

app.get('/', (req, res) => res.send('Servicio de Subastas'))

app.get("/finish", async (req, res) => {
const auction_id = req.query.auction_id;
const tiempo = req.query.tiempo;
let startTime = new Date(Date.now() + tiempo*60*1000);
var j = await schedule.scheduleJob({ start: startTime, rule: '*/1 * * * * *' }, async function(){
	const auction = await db.pool.query(`SELECT * FROM auction where auction_id = ?`, [auction_id]);
	if(auction[0].state == 1){
		const auction_satate = await db.pool.query(`UPDATE auction SET state = 2 where auction_id = ?`, [auction_id]);
		const all = await db.pool.query(`Select auction.name,auction.price,auction.quantity,auction.photo, auctionuser_detail.offer, user.names,user.lastnames,user.email
from auction,auctionuser_detail,user 
where auction.auction_id = ?
and auction.auction_id = auctionuser_detail.auction_id
and auctionuser_detail.user_id = user.user_id
order by offer desc
limit 1`, [auction_id]);
		if(all.length>0){
			const info = all[0];
			await subasta_ganada(info.email,info.offer,info.name,info.quantity,info.names+" "+info.lastnames,info.photo);
			console.log("debió enviar correo a "+info.email);
		} else {
		console.log(all);
		console.log("no hay bids xd");
		}
	} else {
		console.log("no entra xd");
	}
  j.cancel();
});
res.send("Subasta establecida");
});

async function subasta_ganada(correo, total, nombre,cantidad,nombre_usuario,photo) {
    const pre = `<!doctype html>
    <html lang="es">
      <body>
          <div style="margin-left: 30px;margin-right: 30px;background-color: DarkSlateGrey;"><br/><h1 style="margin-left: 30px;color:white;font-size: 70px;font-family:sans-serif;">EconoAhorro</h1></br></div>
        <br/>
        <h4 style="text-align: center;font-size: 30px;font-family:sans-serif;">Hola ${nombre_usuario}</h4>
        <h2 style="text-align: center;color:DarkSlateGrey;font-size: 45px;font-family:sans-serif;">¡Has ganado la subasta!</h2>
        <p style="text-align: center;font-size: 15px;font-family:sans-serif;">Tu oferta ha sido la ganadora, entra a tu perfil para continuar con la compra.</p>
        <p style="margin-left: 40px;margin-right: 40px;color:DimGray;font-size: 18px;font-family:sans-serif;">Detalles</p>
        <div style="margin-left: 30px;margin-right: 30px;">
        <table style="border-collapse:collapse;border-spacing:0;width:100%;max-width:100%;margin-bottom:20px;">
      <thead style="background-color: DarkSlateGrey;color:white;">
        <tr>
          <th style="font-size:20px;text-align: right;font-family:sans-serif;">Producto</th>
          <th style="font-size:20px;font-family:sans-serif;">&nbsp;&nbsp;&nbsp;&nbsp;</th>
          <th style="font-size:20px;font-family:sans-serif;">Precio</th>
          <th style="font-size:20px;font-family:sans-serif;">Cantidad</th>
          <th style="font-size:20px;font-family:sans-serif;">Total</th>
        </tr>
      </thead>
      <tbody>
    `;
    const post = `</tbody>
    </table>
    </div>
    <div style="margin-left: 30px;margin-right: 30px;background-color: DarkSlateGrey;height:10px"></div>
    <h4 style="margin-left: 30px;margin-right: 30px;text-align: right;font-weight: bold;font-size:30px;">Total  	&nbsp; 	&nbsp; 	&nbsp;Q${total}</h4>
    <div style="margin-left: 30px;margin-right: 30px;background-color: DarkSlateGrey;"></br>
</body>
    </html>`;
    var table = '';
    table += `<tr>
        <th style="text-align: center;"><img style="width:150px" src="${photo}" alt="${nombre}"></th>
        <th style="text-align: left;font-size:15px;font-family:sans-serif;">${cantidad}</th>
        <th style="font-size:15px;font-weight: normal;font-family:sans-serif;">${total}</th>
        <th style="font-size:15px;font-weight: normal;font-family:sans-serif;">${cantidad}</th>
        <th style="font-size:15px;font-family:sans-serif;">${total}</th>
        </tr>`;
    var mailOptions = {
        from: 'EconoAhorro',
        to: correo,
        subject: '¡Tu oferta fue la ganadora!',
        html: pre + table + post
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

app.get('/test', (req, res) => res.send('gg'))


app.listen(port, () => console.log(port))
