"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";


interface MarketData {

  pair:string;
  price:number;
  bias:string;
  trend:string;
  signal:string;
  liquidity:string;
  confidence:number;
  updated:string;
  status:string;

}



export default function LiveMarketCard(){


const [data,setData]=useState<MarketData | null>(null);

const [loading,setLoading]=useState(true);



async function loadGold(){


try{


const res = await fetch(
"/api/gold",
{
cache:"no-store"
}
);



const json = await res.json();



setData(json);



}catch(error){

console.log(
"MARKET ERROR",
error
);


}

finally{

setLoading(false);

}


}





useEffect(()=>{


loadGold();



const timer=setInterval(
loadGold,
2000
);



return()=>clearInterval(timer);



},[]);





const bullish =
data?.bias === "BULLISH";


const bearish =
data?.bias === "BEARISH";



const signalColor =

bullish

?
"text-green-400"

:

bearish

?
"text-red-400"

:

"text-yellow-400";



const Icon =

bullish

?
TrendingUp

:

bearish

?
TrendingDown

:

Minus;



return(


<div

className="
relative
overflow-hidden
rounded-3xl
border
border-white/10
bg-gradient-to-br
from-zinc-950
via-black
to-zinc-900
p-6
shadow-2xl
"


>



{/* HEADER */}


<div className="
flex
items-center
justify-between
">


<div>

<p className="
text-xs
tracking-[0.4em]
text-zinc-500
">

NOXVEIL LIVE ENGINE

</p>


<h2 className="
mt-2
text-3xl
font-black
">

XAUUSD

</h2>


</div>



<div className="
flex
items-center
gap-2
text-green-400
">


<span className="
h-3
w-3
rounded-full
bg-green-400
animate-pulse
"/>


LIVE

</div>



</div>





{/* PRICE */}


<div className="
mt-8
">


<p className="
text-xs
text-zinc-500
">

CURRENT PRICE

</p>


<h1 className="
mt-2
text-5xl
font-black
text-amber-400
transition-all
">


{

loading

?

"Loading..."

:

`$${data?.price?.toFixed(2)}`

}


</h1>


</div>







{/* BIAS */}



<div className="
mt-8
grid
grid-cols-2
gap-4
">


<div className="
rounded-2xl
bg-white/5
p-5
">


<p className="
text-xs
text-zinc-500
">

AI BIAS

</p>


<div className="
mt-3
flex
items-center
gap-3
">


<Icon
className={`
h-8
w-8
${signalColor}
`}
/>



<h3 className={`
text-2xl
font-black
${signalColor}
`}>

{
data?.bias || "-"
}

</h3>


</div>


</div>





<div className="
rounded-2xl
bg-white/5
p-5
">


<p className="
text-xs
text-zinc-500
">

CONFIDENCE

</p>


<h3 className="
mt-3
text-3xl
font-black
text-purple-400
">

{
data?.confidence || 0
}%

</h3>



<div className="
mt-3
h-2
overflow-hidden
rounded-full
bg-zinc-800
">


<div

className="
h-full
rounded-full
bg-purple-500
transition-all
"

style={{
width:`${data?.confidence || 0}%`
}}

/>


</div>


</div>


</div>







{/* SIGNAL */}


<div className="
mt-5
rounded-2xl
border
border-white/10
bg-black
p-5
">


<p className="
text-xs
text-zinc-500
">

AI SIGNAL

</p>


<h2 className={`
mt-3
text-xl
font-black
${signalColor}
`}>

{
data?.signal || "WAIT"
}


</h2>


</div>








{/* FOOTER */}



<div className="
mt-6
flex
items-center
justify-between
text-xs
text-zinc-500
">


<div className="
flex
items-center
gap-2
">


<Activity className="h-4 w-4"/>


NOXVEIL MARKET ENGINE


</div>



<span>

{
data?.updated || "--:--"
}

</span>



</div>




</div>


)


}