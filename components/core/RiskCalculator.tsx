"use client"

import { useState } from "react"


export default function RiskCalculator(){

const [balance,setBalance] = useState(1000)
const [risk,setRisk] = useState(2)
const [sl,setSl] = useState(50)


const maxLoss = balance * (risk / 100)

const lot = maxLoss / (sl * 10)


return (

<div
className="
rounded-2xl
border
border-orange-500/30
bg-black
p-5
"
>


<h2
className="
text-xl
font-black
text-orange-400
"
>
RISK CALCULATOR
</h2>


<p
className="
mt-2
text-sm
text-zinc-400
"
>
Manage your trading risk
</p>



<div className="mt-5 space-y-4">


<div>

<label className="text-xs text-zinc-500">
ACCOUNT BALANCE ($)
</label>

<input

type="number"

value={balance}

onChange={(e)=>setBalance(Number(e.target.value))}

className="
mt-2
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>

</div>



<div>

<label className="text-xs text-zinc-500">
RISK (%)
</label>

<input

type="number"

value={risk}

onChange={(e)=>setRisk(Number(e.target.value))}

className="
mt-2
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>

</div>



<div>

<label className="text-xs text-zinc-500">
STOP LOSS (PIPS)
</label>

<input

type="number"

value={sl}

onChange={(e)=>setSl(Number(e.target.value))}

className="
mt-2
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>

</div>


</div>




<div
className="
mt-6
grid
grid-cols-2
gap-3
"
>


<div
className="
rounded-xl
bg-red-500/10
p-4
"
>

<p className="text-xs text-zinc-400">
MAX LOSS
</p>

<h3 className="text-xl font-bold text-red-400">
${maxLoss.toFixed(2)}
</h3>

</div>




<div
className="
rounded-xl
bg-orange-500/10
p-4
"
>

<p className="text-xs text-zinc-400">
LOT SIZE
</p>

<h3 className="text-xl font-bold text-orange-400">
{lot.toFixed(2)}
</h3>

</div>



</div>



</div>

)

}