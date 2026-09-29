"use client";

import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  Activity
} from "lucide-react";


interface Props {
  data:any;
}



export default function AIReport({data}:Props){


if(!data){

return null;

}



const bullish =
data.bias === "BULLISH";


const bearish =
data.bias === "BEARISH";



return(


<div
className="
mt-6
rounded-3xl
border
border-white/10
bg-gradient-to-br
from-black
via-zinc-950
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

NOXVEIL AI REPORT

</p>


<h2 className="
mt-2
text-3xl
font-black
">

{data.pair}

</h2>

</div>



<Activity
className="
text-green-400
animate-pulse
"/>


</div>





{/* PRICE */}


<div className="
mt-6
rounded-2xl
bg-white/5
p-5
">


<p className="
text-xs
text-zinc-500
">

LIVE PRICE

</p>


<h1 className="
mt-2
text-4xl
font-black
text-amber-400
">

${data.price?.toFixed(2)}

</h1>


</div>







{/* BIAS GRID */}


<div className="
mt-5
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

MARKET BIAS

</p>


<div className="flex items-center gap-2 mt-3">


{

bullish &&

<TrendingUp
className="
text-green-400
"
/>

}



{

bearish &&

<TrendingDown
className="
text-red-400
"
/>

}



<h3
className={`
font-black
text-xl

${

bullish

?

"text-green-400"

:

bearish

?

"text-red-400"

:

"text-yellow-400"

}

`}
>

{data.bias}

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

{data.confidence}%

</h3>



<div className="
mt-3
h-2
rounded-full
bg-zinc-800
overflow-hidden
">

<div

className="
h-full
bg-purple-500
"

style={{
width:`${data.confidence}%`
}}

/>


</div>


</div>



</div>








{/* STRUCTURE */}


<div className="
mt-5
grid
gap-4
md:grid-cols-2
">


<div className="
rounded-2xl
border
border-white/10
p-5
">


<p className="
text-xs
text-zinc-500
">

MARKET STRUCTURE

</p>


<p className="
mt-2
font-bold
text-white
">

{data.structure}

</p>


</div>




<div className="
rounded-2xl
border
border-white/10
p-5
">


<p className="
text-xs
text-zinc-500
">

LIQUIDITY

</p>


<p className="
mt-2
font-bold
text-white
">

{data.liquidity}

</p>


</div>



</div>









{/* SIGNAL */}


<div className="
mt-5
rounded-2xl
border
border-amber-500/30
bg-amber-500/10
p-5
">


<p className="
text-xs
text-zinc-400
">

AI SIGNAL

</p>


<h2 className="
mt-2
text-xl
font-black
text-amber-400
">

{data.signal}

</h2>


</div>









{/* ZONE */}


<div className="
mt-5
rounded-2xl
bg-black
border
border-white/10
p-5
">


<div className="
flex
items-center
gap-2
mb-4
">


<Target
className="
text-amber-400
"
/>


<h3 className="
font-black
">

SMART MONEY ZONE

</h3>


</div>




<div className="
grid
grid-cols-2
gap-4
text-sm
">


<p>
ENTRY
<br/>

<b>
{data.zone?.entry}
</b>

</p>



<p>
STOP LOSS
<br/>

<b className="text-red-400">
{data.zone?.stop}
</b>

</p>



<p>
TARGET 1
<br/>

<b className="text-green-400">
{data.zone?.target1}
</b>

</p>



<p>
TARGET 2
<br/>

<b className="text-green-400">
{data.zone?.target2}
</b>

</p>


</div>


</div>









{/* RISK */}


<div className="
mt-5
flex
items-center
gap-3
rounded-2xl
bg-white/5
p-5
">


<ShieldCheck
className="
text-green-400
"
/>


<div>

<p className="
text-xs
text-zinc-500
">

RISK MANAGEMENT

</p>


<p className="font-bold">

{data.risk?.reward}
-
{data.risk?.management}

</p>


</div>


</div>







<div className="
mt-5
text-xs
text-zinc-500
flex
justify-between
">


<span>
{data.session}
</span>


<span>
{data.updated}
</span>


</div>



</div>


)


}