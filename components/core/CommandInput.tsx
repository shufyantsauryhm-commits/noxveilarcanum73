"use client";

import { useState } from "react";
import {
  Sparkles,
  Activity
} from "lucide-react";

import AIReport from "./AIReport";



export default function CommandInput(){


const [command,setCommand] = useState("");

const [data,setData] = useState<any>(null);

const [loading,setLoading] = useState(false);




async function analyze(){


try{


setLoading(true);



const res = await fetch(
"/api/gold",
{
cache:"no-store"
}
);



const json = await res.json();



setData(json);



}

catch(error){

console.log(
"AI COMMAND ERROR:",
error
);


}



finally{


setLoading(false);


}


}






return(


<div className="
space-y-6
">





{/* COMMAND BAR */}



<div className="
flex
gap-3
">


<div className="
relative
flex-1
">


<Sparkles

className="
absolute
left-4
top-4
h-5
w-5
text-amber-400
"

/>



<input


value={command}


onChange={(e)=>
setCommand(e.target.value)
}


placeholder="
Analyze XAUUSD / Market Bias / Entry Zone...
"


className="
w-full
rounded-xl
border
border-white/10
bg-black
py-4
pl-12
pr-5
text-white
outline-none
focus:border-amber-500
"

/>



</div>







<button

onClick={analyze}

disabled={loading}

className="
rounded-xl
bg-amber-500
px-8
font-black
text-black
transition
hover:scale-105
disabled:opacity-50
"

>


{

loading

?

"SCANNING..."

:

"SCAN"

}


</button>



</div>








{/* LOADING */}



{

loading &&

<div

className="
rounded-2xl
border
border-amber-500/30
bg-amber-500/10
p-6
text-amber-400
animate-pulse
"

>


<div className="
flex
items-center
gap-3
">


<Activity

className="
animate-spin
"

/>



NOXVEIL QUANT ENGINE ACTIVE


</div>



<p className="
mt-3
text-sm
text-zinc-400
">


Analyzing:

<br/>

• Market Structure

<br/>

• Liquidity Flow

<br/>

• Smart Money Zone

<br/>

• Risk Model


</p>


</div>


}








{/* AI REPORT */}



{

data && !loading &&

<AIReport

data={data}

/>


}






</div>


)


}