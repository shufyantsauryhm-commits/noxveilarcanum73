"use client"

import {
  BarChart3,
  Target,
  Calculator,
  BookOpen
} from "lucide-react"



export default function QuickActions({

  onMarket = ()=>{},
  onBias = ()=>{},
  onRisk = ()=>{},
  onJournal = ()=>{}

}:{

  onMarket?:()=>void
  onBias?:()=>void
  onRisk?:()=>void
  onJournal?:()=>void

}){



const actions = [

{
name:"Market Analysis",
desc:"Analyze market condition",
icon:BarChart3,
action:onMarket
},

{
name:"XAUUSD Bias",
desc:"AI gold direction",
icon:Target,
action:onBias
},

{
name:"Risk Calculator",
desc:"Manage trading risk",
icon:Calculator,
action:onRisk
},

{
name:"Trading Journal",
desc:"Track your trades",
icon:BookOpen,
action:onJournal
}

]





return (

<div

className="
rounded-2xl
border
border-white/10
bg-black/40
p-5
backdrop-blur-xl
"

>


<h3

className="
mb-5
text-sm
font-black
tracking-[0.25em]
text-zinc-400
"

>
QUICK ACTIONS
</h3>




<div

className="
grid
grid-cols-2
gap-4
"

>


{

actions.map((item)=>{


const Icon = item.icon


return (

<button

key={item.name}

type="button"

onClick={item.action}

className="
group
rounded-xl
border
border-white/10
bg-white/5
p-4
text-left
transition
hover:border-orange-500
hover:bg-orange-500/10
"

>


<Icon

className="
h-6
w-6
text-orange-400
transition
group-hover:scale-110
"

/>



<p

className="
mt-3
text-sm
font-bold
text-white
"

>
{item.name}
</p>



<p

className="
mt-1
text-xs
text-zinc-500
"

>
{item.desc}
</p>



</button>

)

})

}



</div>



</div>


)

}