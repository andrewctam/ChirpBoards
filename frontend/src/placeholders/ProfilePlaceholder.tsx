import UserPhoto from "../UserPhoto"
import ChirpPlaceholder from "./ChirpPlaceholder"

const ProfilePlaceholder = () => {
    return (
        <>
        <div className="text-center p-4 shadow-md relative bg-[#555555]">
            <UserPhoto
                userColor={"#555555"}
                url={""}
                size={100} />

            <div className="flex justify-center gap-4 my-2">
                <div className="h-[70px] px-20 text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/20 py-1 rounded-xl">
                </div>

                <div className="h-[70px] px-12 text-sm w-fit my-auto border border-white/10 text-black bg-slate-200/20 py-1 rounded-xl">
                   
                </div>
            </div>
        </div>


        <div className="mt-4 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            <ul className="mt-4">
                <ChirpPlaceholder />
                <ChirpPlaceholder />
                <ChirpPlaceholder />
            </ul>
        </div>
</>
    )
}


export default ProfilePlaceholder