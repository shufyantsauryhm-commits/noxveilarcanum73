"use client"

import {useEffect, useState} from "react"


type Journal = {
pair:string
entry:number
sl:number
tp:number
slPips:number
tpPips:number
rr:string
result:string
note:string
date:string
}



export default function TradingJournal(){


const [pair,setPair]=useState("XAUUSD")

const [entry,setEntry]=useState(0)

const [sl,setSl]=useState(0)

const [tp,setTp]=useState(0)

const [result,setResult]=useState("WIN")

const [note,setNote]=useState("")

const [history,setHistory]=useState<Journal[]>([])





useEffect(()=>{

const data=localStorage.getItem("noxveil-journal")

if(data){

setHistory(JSON.parse(data))

}

},[])







function calculatePips(){


const slPips=Math.abs(entry-sl)*10

const tpPips=Math.abs(tp-entry)*10


const rr = slPips===0
?
"0"
:
(tpPips/slPips).toFixed(2)



return{
slPips,
tpPips,
rr
}


}






function saveJournal(){


const calc=calculatePips()


const data:Journal={

pair,

entry,

sl,

tp,

slPips:calc.slPips,

tpPips:calc.tpPips,

rr:calc.rr,

result,

note,

date:new Date().toLocaleDateString()

}




const update=[

data,

...history

]


setHistory(update)


localStorage.setItem(
"noxveil-journal",
JSON.stringify(update)
)



setNote("")


}







const win=history.filter(
x=>x.result==="WIN"
).length


const winrate=history.length===0
?
0
:
Math.round((win/history.length)*100)






return(


<div

className="
rounded-2xl
border
border-white/10
bg-black/40
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
TRADING JOURNAL
</h2>


<p className="
mt-1
text-sm
text-zinc-500
">
Professional XAUUSD Tracking
</p>







<div
className="
mt-5
grid
grid-cols-3
gap-3
"
>


<div className="rounded-xl bg-white/5 p-3">

<p className="text-xs text-zinc-500">
TRADE
</p>

<b className="text-white">
{history.length}
</b>

</div>



<div className="rounded-xl bg-green-500/10 p-3">

<p className="text-xs text-zinc-500">
WIN
</p>

<b className="text-green-400">
{win}
</b>

</div>




<div className="rounded-xl bg-orange-500/10 p-3">

<p className="text-xs text-zinc-500">
WINRATE
</p>

<b className="text-orange-400">
{winrate}%
</b>

</div>


</div>









<div className="
mt-6
space-y-3
">


<input

value={pair}

onChange={(e)=>setPair(e.target.value)}

className="
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

placeholder="Pair"

/>




<input

type="number"

placeholder="Entry Price"

onChange={(e)=>setEntry(Number(e.target.value))}

className="
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>



<input

type="number"

placeholder="Stop Loss"

onChange={(e)=>setSl(Number(e.target.value))}

className="
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>





<input

type="number"

placeholder="Take Profit"

onChange={(e)=>setTp(Number(e.target.value))}

className="
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>






<select

value={result}

onChange={(e)=>setResult(e.target.value)}

className="
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

>

<option>WIN</option>

<option>LOSS</option>

<option>BREAK EVEN</option>


</select>







<textarea

value={note}

onChange={(e)=>setNote(e.target.value)}

placeholder="Entry reason..."

className="
h-24
w-full
rounded-xl
bg-zinc-900
p-3
text-white
"

/>





<button

onClick={saveJournal}

className="
w-full
rounded-xl
bg-orange-500
py-3
font-bold
text-black
"

>
SAVE TRADE
</button>


</div>









<div className="mt-6">


<h3 className="mb-3 font-bold text-white">
TRADE HISTORY
</h3>



{
history.map((item,index)=>(


<div

key={index}

className="
mb-3
rounded-xl
border
border-white/10
bg-white/5
p-4
"

>


<div className="flex justify-between">

<b className="text-white">
{item.pair}
</b>


<span className={
item.result==="WIN"
?
"text-green-400"
:
"text-red-400"
}>
{item.result}
</span>


</div>




<p className="text-xs text-zinc-500">
{item.date}
</p>



<div className="
mt-3
grid
grid-cols-3
gap-2
text-xs
">


<div>
ENTRY
<br/>
{item.entry}
</div>


<div>
SL
<br/>
{item.slPips} pips
</div>


<div>
TP
<br/>
{item.tpPips} pips
</div>


</div>




<p className="mt-3 text-orange-400">
RR 1 : {item.rr}
</p>



<p className="mt-2 text-zinc-300">
{item.note}
</p>




<button

onClick={()=>{

const update=history.filter(
(_,i)=>i!==index
)

setHistory(update)

localStorage.setItem(
"noxveil-journal",
JSON.stringify(update)
)

}}

className="
mt-3
text-xs
text-red-400
"
>
DELETE
</button>



</div>


))

}



</div>





</div>


)

}