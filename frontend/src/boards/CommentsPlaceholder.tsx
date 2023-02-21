
interface CommentsPlaceholderProps {
    opacity: string,
    showNoComments?: boolean,
}
const CommentsPlaceholder = (props: CommentsPlaceholderProps) => {
    
    return (
        <div style = {{opacity: props.opacity}}
            className = "w-[95%] ml-[5%] my-6 h-24 rounded-bl-xl border border-black/10 rounded-tr-xl bg-black/5 shadow-md flex justify-center items-center">
            {props.showNoComments ?
                <div className = "w-fit h-fit text-white/50 text-xl select-none flex">
                    No Comments Yet
                </div>
            : null}
        </div>
    )
}


export default CommentsPlaceholder