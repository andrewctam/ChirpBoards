import SpinningCircle from "../SpinningCircle"
import CommentsPlaceholder from "./CommentsPlaceholder"

const BoardPlaceholder = () => {
    return (
        <div className="mx-auto w-11/12 md:w-4/5">
            <div className="w-full mt-6 mb-6 ounded-bl-xl rounded-tr-xl bg-black/20 text-white relative break-all shadow-md">
                <div className="text-white truncate relative" >
                    <SpinningCircle />
                </div>
            </div>

            <div className="bg-black/20 p-4 my-2 rounded-xl shadow-md">
                <CommentsPlaceholder opacity={"90%"} showSpinning = {true} />
                <CommentsPlaceholder opacity={"50%"} showSpinning = {true} />
                <CommentsPlaceholder opacity={"25%"} showSpinning = {true} />
            </div>
        </div>
    )
}

export default BoardPlaceholder