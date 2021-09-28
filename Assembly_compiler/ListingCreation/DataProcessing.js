import firstPassage from "./FirstPassage.js";
import {commonTitle, getCommonInfo} from "./Templates.js";

export default function getDataForListing(data) {
    let outputData = commonTitle(1)
    /**Processing each parsed line*/

    /**First passage*/
    let index = 0
    for (const line of data) {
        const info = firstPassage(line, index)
        outputData += info.str
        if (info.end) break

        if (info.prevDisplacement >= 0)
            line.displacement = info.prevDisplacement
        else
            line.error = info.str
        index++
    }
    outputData += getCommonInfo()
    return outputData
}