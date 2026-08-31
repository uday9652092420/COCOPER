/**
 * @file SupplierMasterPage.tsx
 * @description Supplier master maintenance screen.
 * Integrated with backend supplier API.
 */

import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import { toast } from "sonner";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getNextSupplierCode
} from "../../services/supplierservices/supplier.service";

import type {
  SupplierResponse
} from "../../services/supplierservices/supplier.service";


import { PageHeader } from "../../components/common/PageHeader";
import { Toolbar } from "../../components/common/Toolbar";
import { SearchFilterPanel } from "../../components/common/SearchFilterPanel";
import DataGrid from "../../components/common/DataGrid";

import MasterFormModal, {
  type FormFieldConfig
} from "./components/MasterFormModal";

import ConfirmDialog from "../../components/common/ConfirmDialog";

import { formatDate } from "../../utils/format";
import { usePermissions } from "../../hooks/usePermissions";
import { INDIAN_STATES } from "../../constants/indianStates";



interface Supplier {

  id:string;

  code:string;

  name:string;

  type:
  | "Local"
  | "National"
  | "International";


  state?:string;

  address?:string;

  mobile?:string;

  whatsapp?:string;


  contactPerson?:string;

  contactPerson1?:string;

  contactNo1?:string;

  contactPerson2?:string;

  contactNo2?:string;

  contactPerson3?:string;

  contactNo3?:string;


  openingBalance:number;


  status:
  | "Active"
  | "Inactive";


  createdAt:string;

}




interface SupplierFormValues {


code:string;

name:string;


type:
| "Local"
| "National"
| "International";


state?:string;


address?:string;


mobile?:string;


whatsapp?:string;


contactPerson?:string;

contactPerson1?:string;

contactNo1?:string;

contactPerson2?:string;

contactNo2?:string;

contactPerson3?:string;

contactNo3?:string;


opening_balance:number;


status:
| "Active"
| "Inactive";

}




const SupplierMasterPage:React.FC =()=>{

const { can } = usePermissions();

const [records,setRecords]=useState<Supplier[]>([]);

const [loading,setLoading]=useState(false);


const [search,setSearch]=useState("");


const [statusFilter,setStatusFilter]=useState("");


const [modalOpen,setModalOpen]=useState(false);


const [editing,setEditing]=useState<Supplier|null>(null);


const [confirmDelete,setConfirmDelete]=
useState<Supplier|null>(null);



/**
 * Convert backend response
 * snake_case -> camelCase
 */
const mapSupplier=(item:SupplierResponse):Supplier=>({

id:item.id,

code:item.code,

name:item.name,

type:item.type,

state:item.state ?? "",

address:item.address ?? "",

mobile:item.mobile ?? "",

whatsapp:item.whatsapp ?? "",


contactPerson:item.contact_person ?? "",

contactPerson1:item.contact_person1 ?? "",

contactNo1:item.contact_no1 ?? "",

contactPerson2:item.contact_person2 ?? "",

contactNo2:item.contact_no2 ?? "",

contactPerson3:item.contact_person3 ?? "",

contactNo3:item.contact_no3 ?? "",


openingBalance:item.opening_balance,


status:item.status,


createdAt:item.created_at

});




/**
 * Load suppliers
 */

const loadSuppliers=async()=>{


try{


setLoading(true);


const response =
await getSuppliers();



setRecords(
response.map(mapSupplier)
);



}
catch(error){


toast.error(
"Failed to load suppliers"
);


}
finally{


setLoading(false);


}

};



useEffect(()=>{


loadSuppliers();


},[]);





const filtered =
useMemo(()=>{


return records.filter((sup)=>{


const q=
search.toLowerCase();



const matchesSearch =

!q ||

sup.code.toLowerCase()
.includes(q)

||

sup.name.toLowerCase()
.includes(q)

||

(sup.mobile ?? "")
.includes(search);



const matchesStatus =

!statusFilter ||

sup.status===statusFilter;



return matchesSearch && matchesStatus;



});


},[
records,
search,
statusFilter
]);



const columns=[


{
key:"code",
label:"Code"
},


{
key:"name",
label:"Name"
},


{
key:"type",
label:"Type"
},


{
key:"contactPerson",
label:"Contact Person"
},


{
key:"mobile",
label:"Mobile"
},


{
  key: "openingBalance",
  label: "Opening Balance",
  render: (row: Supplier) =>
    Number(row.openingBalance).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
},



{
key:"status",

label:"Status",

render:(row:Supplier)=>(

<span
className={`
rounded-full 
px-2 
py-1 
text-xs

${
row.status==="Active"

?
"bg-emerald-100 text-emerald-700"

:

"bg-slate-100 text-slate-600"

}

`}
>

{row.status}

</span>

)

},



{
key:"createdAt",

label:"Created Date",

render:(row:Supplier)=>

formatDate(row.createdAt)

},



{
key:"actions",

label:"Actions",

render:(row:Supplier)=>(


<div className="flex gap-2">


{can("supplier","edit") ? (
<button

onClick={()=>openEdit(row)}

className="
rounded-full
border
px-3
py-1
text-xs
"

>

Edit

</button>
) : null}


{can("supplier","delete") ? (
<button

onClick={()=>setConfirmDelete(row)}

className="
rounded-full
bg-rose-600
text-white
px-3
py-1
text-xs
"

>

Delete

</button>
) : null}


</div>


)

}


];


const fields:FormFieldConfig[]=[


{
  name: "code",
  label: "Supplier Code",
  type: "text",
  required: true,
  readOnly: true,
},


{
name:"name",
label:"Supplier Name",
type:"text",
required:true
},



{
name:"type",
label:"Supplier Type",
type:"select",
required:true,

options:[

{
label:"Local",
value:"Local"
},

{
label:"National",
value:"National"
},

{
label:"International",
value:"International"
}

]

},



{
name:"state",
label:"State",
type:"select",
required:false,
options: INDIAN_STATES.map((state) => ({ label: state, value: state }))
},



{
name:"contactPerson",
label:"Contact Person 1",
type:"text",
required:false
},


{
name:"contactNo1",
label:"Contact No",
type:"text",
required:false
},


{
name:"contactPerson1",
label:"Contact Person 2",
type:"text",
required:false
},



{
name:"contactNo2",
label:"Contact No",
type:"text",
required:false
},

{
name:"contactPerson2",
label:"Contact Person 3",
type:"text",
required:false
},

{
name:"contactNo3",
label:"Contact No",
type:"text",
required:false
},


{
name:"address",
label:"Address",
type:"textarea",
required:false
},



{
name:"mobile",
label:"Mobile",
type:"text",
required:false
},



{
name:"whatsapp",
label:"WhatsApp",
type:"text",
required:false
},



{
name:"opening_balance",
label:"Opening Balance",
type:"number",
required:false
},



{
name:"status",
label:"Status",
type:"select",
required:true,

options:[

{
label:"Active",
value:"Active"
},

{
label:"Inactive",
value:"Inactive"
}

]

}


];





/**
 * Open Add Supplier
 */
const openAdd = async () => {
  try {
    setEditing(null);

    const code = await getNextSupplierCode();

   setEditing({
  id: "",
  code,
  name: "",
  type: "Local",
  state: "",
  address: "",
  mobile: "",
  whatsapp: "",
  contactPerson: "",
  contactPerson1: "",
  contactNo1: "",
  contactPerson2: "",
  contactNo2: "",
  contactPerson3: "",
  contactNo3: "",
  openingBalance: 0,
  status: "Active",
  createdAt: "",
});

    setModalOpen(true);
  } catch (error: any) {
    toast.error(error.message || "Failed to generate supplier code");
  }
};



/**
 * Open Edit
 */

const openEdit=(row:Supplier)=>{


setEditing(row);


setModalOpen(true);


};





/**
 * Save Supplier
 */

const handleSave=
async(
values:SupplierFormValues,
resetAfter:boolean
)=>{


try{


const payload={


code:values.code,

name:values.name,

type:values.type,


state:values.state,


address:values.address,


mobile:values.mobile,


whatsapp:values.whatsapp,



contact_person:
values.contactPerson,


contact_person1:
values.contactPerson1,


contact_no1:
values.contactNo1,


contact_person2:
values.contactPerson2,


contact_no2:
values.contactNo2,

contact_person3:
values.contactPerson3,

contact_no3:
values.contactNo3,


opening_balance:
Number(values.opening_balance),



status:
values.status


};



console.log("Editing:", editing);

if (editing?.id) {
  await updateSupplier(editing.id, payload);

  toast.success("Supplier updated successfully");
} else {
  await createSupplier(payload);

  toast.success("Supplier created successfully");
}



await loadSuppliers();



if(!resetAfter){


setModalOpen(false);


setEditing(null);


}
else {
  await loadSuppliers();

  const code = await getNextSupplierCode();

  setEditing({
  id: "",
  code,
  name: "",
  type: "Local",
  state: "",
  address: "",
  mobile: "",
  whatsapp: "",
  contactPerson: "",
  contactPerson1: "",
  contactNo1: "",
  contactPerson2: "",
  contactNo2: "",
  contactPerson3: "",
  contactNo3: "",
  openingBalance: 0,
  status: "Active",
  createdAt: "",
});
}


}

catch(error:any){



toast.error(

error?.message ??

"Supplier save failed"

);



}



};






/**
 * Delete Supplier
 */

const handleDelete=
async()=>{


if(!confirmDelete)
return;



try{


await deleteSupplier(
confirmDelete.id
);



toast.success(
"Supplier deleted"
);



setConfirmDelete(null);



loadSuppliers();



}

catch(error:any){


toast.error(

error?.message ??

"Delete failed"

);


}


};





return(


<div>


<PageHeader

title="Supplier Master"

breadcrumb={[
"Masters",
"Supplier Master"
]}

/>



<Toolbar

title="Supplier Master"

onAdd={can("supplier","create") ? openAdd : undefined}

/>



<SearchFilterPanel

onSearch={setSearch}

onClear={()=>{
setSearch("")
}}

/>



{

loading ?


<div
className="
p-5
text-center
text-slate-500
"
>

Loading suppliers...

</div>


:

<DataGrid

columns={columns}

data={filtered}

rowKey={(r:Supplier)=>r.id}

/>


}






<MasterFormModal<SupplierFormValues>


open={modalOpen}



title={
editing?.id

?

"Edit Supplier"

:

"Add Supplier"

}



fields={fields}



defaultValues={


editing

?


{


code:editing.code,


name:editing.name,


type:editing.type,


state:editing.state ?? "",


address:editing.address ?? "",


mobile:editing.mobile ?? "",


whatsapp:editing.whatsapp ?? "",


contactPerson:
editing.contactPerson ?? "",


contactPerson1:
editing.contactPerson1 ?? "",


contactNo1:
editing.contactNo1 ?? "",


contactPerson2:
editing.contactPerson2 ?? "",


contactNo2:
editing.contactNo2 ?? "",

contactPerson3:
editing.contactPerson3 ?? "",

contactNo3:
editing.contactNo3 ?? "",


opening_balance:
editing.openingBalance,


status:
editing.status


}


:



{


code:"",

name:"",

type:"Local",

state:"",

address:"",

mobile:"",

whatsapp:"",

contactPerson:"",

contactPerson1:"",

contactNo1:"",

contactPerson2:"",

contactNo2:"",

contactPerson3:"",

contactNo3:"",

opening_balance:0,

status:"Active"


}



}



onClose={()=>{


setModalOpen(false);


setEditing(null);


}}



onSave={handleSave}



/>







<ConfirmDialog


open={!!confirmDelete}



title="Delete supplier?"



description={

confirmDelete

?

`Are you sure you want to delete ${confirmDelete.name}?`

:

""

}



confirmLabel="Delete"


cancelLabel="Cancel"



onConfirm={handleDelete}



onCancel={()=>{

setConfirmDelete(null)

}}



/>



</div>


)



}



export default SupplierMasterPage;