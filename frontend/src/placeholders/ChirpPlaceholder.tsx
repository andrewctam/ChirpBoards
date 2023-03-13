import Vote from "../boards/Vote"
import SpinningCircle from "../SpinningCircle"


function ChirpPlaceholder() {

    return (
    <li className={`w-full relative mb-8`}>
        <div className="block bg-black/20 text-white rounded-bl-xl rounded-tr-xl truncate p4" >
            <SpinningCircle />
        </div>
        
        <Vote postId={"EXAMPLE_CHIRP"} initialScore={0} initialVoteStatus = {0}/>
    </li>
    )


}


export default ChirpPlaceholder