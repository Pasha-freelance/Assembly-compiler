const common = {
    currentDisplacement: 0x0,
    currentSegment: '',
    variables: {},
    identifiers: {},
    errors: [],
    segmentCounter:1,
    equS:{},
    setNewEqu(name,operand,value){
      this.equS[name] = {
          name,
          operand,
          value
      }
    },
    getEquValue(name){
      return this.equS[name].value
    },
    hasEqu(name){
      return !!this.equS[name]
    },
    nullifyDisplacement() {
        this.currentDisplacement = 0x0
    },
    nullifySegment() {
        this.currentSegment = ''
    },
    setCurrentSegment(name) {
        this.currentSegment = name
    },
    addSizeToDisplacement(size) {
        this.currentDisplacement += size
    },
    hasIdentifier(token) {
        return !!this.identifiers[token];
    },
    hasVariable(token) {
        return !!this.variables[token];
    },
    setNewUserIdentifier(name) {
        if (!this.hasIdentifier(name)) {
            this.identifiers[name] = {
                name,
                displacement: this.currentDisplacement,
                segment: this.currentSegment
            }
            return true
        }
    },
    setNewVariable(name, size, value) {
        this.variables[name] = {
            name,
            capacity:size,
            value,
            isVar:true,
            displacement: this.currentDisplacement,
            segment: this.currentSegment
        }
        return 0
    },
    setIsSegmentName(name) {
        this.identifiers[name].isSegmentName = true
        delete this.identifiers[name].segment
    },
    setIsLabel(name) {
        this.identifiers[name].isLabel = true
    },
    setIsVar(name, size) {
        this.identifiers[name].isVar = true
        let type
        switch (size) {
            case 1:
                type = 'BYTE'
                break
            case 2:
                type = 'WORD'
                break
            case 4:
                type = 'DWORD'
                break
        }
        this.identifiers[name].type = type
    },
    getVarInfo(name) {
        return {...this.variables[name]}
    },
    setSegmentSize(name) {
        this.identifiers[name].size = this.currentDisplacement
    },
    setPassedLabel(name) {
        this.identifiers[name].wasPassed = true
    },
    updateSegment(name) {
        this.identifiers[name].segment = this.currentSegment
    },
    updateDisplacement(name) {
        this.identifiers[name].displacement = this.currentDisplacement
    },
    updateIdentifierInfo(name) {
        this.setPassedLabel(name)
        this.updateSegment(name)
        this.updateDisplacement(name)
    },
    setNewError(lineIndex, errorText, cause) {
        this.errors.push({
            lineIndex,
            errorText,
            cause: cause ?? ''
        })
    }
}
export default common

