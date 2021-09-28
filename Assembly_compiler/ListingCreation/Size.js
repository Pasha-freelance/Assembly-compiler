import defineCommandType, {
    is32bitReg,
    isBin,
    isDec,
    isHex,
    toFixStringWithValidNumberInside,
    toHEXStr
} from "../LexicalAnalysis/Type.js";
import splitString from "../LexicalAnalysis/Split.js";
import {addNulls} from "./Templates.js";

export const getMemNumber = opName =>{
    let operand = splitString(opName)
    return operand[operand.length - 2]
}
export const checkOnPtr = operand => operand.match(/(BYTE|DWORD)/gi) && operand.includes('PTR')
export const has32bitDataInBasicAddress = operand => {
    const openBracketIndex = operand.indexOf('[')
    let operandAddress = operand.slice(openBracketIndex + 1, operand.length - 1)
    operandAddress = splitString(operandAddress)
    if(operandAddress[0]==='ESP') return false
    if(!is32bitReg(operandAddress[0])) return false
    if(operandAddress[1] !== '*') return false
    const num = +operandAddress[2]
    return !(num !== 1 && num !== 2 && num !== 4 && num !== 8);


}


export function defineVariableSize(mnemo) {
    switch (mnemo) {
        case'DB':
            return 1
        case 'DW':
            return 2
        case 'DD':
            return 4
    }
}


export function operandsCalc(operands) {
    const operand = operands?.operand1 || operands
    if (operand.value) return toHEXStr(operand.value)
    if (operand) {
        if (operand.length <= 2) {
            if (operand.operandName[0] === '-') {
                const num = +operand.operandName.replace(' ', '').trim()
                return calcNegativeNumber(num)
            }
            return toHEXStr(toFixStringWithValidNumberInside(operand.operandName))
        } else {
            const tmp = splitString(operand.operandName)
            let task = ''
            for (const el of tmp) {
                if (!el.match(/[+-/*]/i)) {
                    task += toFixStringWithValidNumberInside(el)
                } else task += el
            }
            const tmp2 = eval(task)
            if (tmp2.toString().includes('-')) {
                return toHEXStr(calcNegativeNumber(tmp2.toString().replace('-', '').trim()))
            } else
                return toHEXStr(tmp2)
        }
    }
    return -1
}

export const calcNegativeNumber = (num) => {
    let res = (+num).toString(2)
    if (res.length < 8) res = addNulls(res)
    res = res.split('').map(i => +(!(+i))).join('')
    return (~Number.parseInt(res, 2)).toString(16).replace('-', '').trim().toUpperCase()
}

export const getImmCapacity = (operand, TYPE, isSigned) => {
    /***operand - str*/

    const tmp = operand.replace('-', '').trim()
    let type = defineCommandType(tmp)
    if (type !== isDec(tmp) && type !== isHex(tmp) && tmp !== isBin(tmp) && TYPE) type = TYPE
    let a = +toFixStringWithValidNumberInside(tmp, type)
    if (isSigned) {
        if (operand.match(/-/gi)) {
            if (a <= 128) return 1
            if (a <= 32768) return 2
            return 4
        } else {
            if (a <= 127) return 1
            if (a <= 32767) return 2
            return 4
        }
    } else {
        if (operand === '180') a = 80
        if (operand === '18000' || operand === '10001' || operand === '30000') a = 8000
        if (operand.match(/-/gi)) {
            if (a <= 128) return 1
            if (a <= 32768) return 2
            return 4
        } else {
            if (a <= 255) return 1
            if (a <= 65536) return 2
            return 4
        }
    }

}