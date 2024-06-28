import {
  isArray,
  isBoolean,
  isDate,
  isEqual,
  isNumber,
  isObject,
  isString,
  partial,
} from "lodash-es";

export class Json2Ts {
  convert(content: string): string {
    let jsonContent = JSON.parse(content);

    if (isArray(jsonContent)) {
      return this.convertObjectToTsInterfaces(jsonContent[0]);
    }

    return this.convertObjectToTsInterfaces(jsonContent);
  }

  private convertObjectToTsInterfaces(
    jsonContent: any,
    objectName: string = "RootObject"
  ): string {
    let optionalKeys: string[] = [];
    let objectResult: string[] = [];

    for (let key in jsonContent) {
      let value = jsonContent[key];

      if (isObject(value) && !isArray(value)) {
        let childObjectName = this.toUpperFirstLetter(key);
        objectResult.push(
          this.convertObjectToTsInterfaces(value, childObjectName)
        );
        jsonContent[key] = this.removeMajority(childObjectName) + ";";
      } else if (isArray(value)) {
        let arrayTypes: any = this.detectMultiArrayTypes(value);

        if (this.isMultiArray(arrayTypes)) {
          let multiArrayBrackets = this.getMultiArrayBrackets(value);

          if (this.isAllEqual(arrayTypes)) {
            jsonContent[key] = arrayTypes[0].replace("[]", multiArrayBrackets);
          } else {
            jsonContent[key] = "any" + multiArrayBrackets + ";";
          }
        } else if (value.length > 0 && isObject(value[0])) {
          let childObjectName = this.toUpperFirstLetter(key);
          objectResult.push(
            this.convertObjectToTsInterfaces(value[0], childObjectName)
          );
          jsonContent[key] = this.removeMajority(childObjectName) + "[];";
        } else {
          jsonContent[key] = arrayTypes[0];
        }
      } else if (isDate(value)) {
        jsonContent[key] = "Date;";
      } else if (isString(value)) {
        jsonContent[key] = "string;";
      } else if (isBoolean(value)) {
        jsonContent[key] = "boolean;";
      } else if (isNumber(value)) {
        jsonContent[key] = "number;";
      } else {
        jsonContent[key] = "any;";
        optionalKeys.push(key);
      }
    }

    let result = this.formatCharsToTypeScript(
      jsonContent,
      objectName,
      optionalKeys
    );
    objectResult.push(result);

    return objectResult.join("\n\n");
  }

  private detectMultiArrayTypes(
    value: any,
    valueType: string[] = []
  ): string[] {
    if (isArray(value)) {
      if (value.length === 0) {
        valueType.push("any[];");
      } else if (isArray(value[0])) {
        for (let index = 0, length = value.length; index < length; index++) {
          let element = value[index];

          let valueTypeResult = this.detectMultiArrayTypes(element, valueType);
          valueType.concat(valueTypeResult);
        }
      } else if (value.every(isString)) {
        valueType.push("string[];");
      } else if (value.every(isNumber)) {
        valueType.push("number[];");
      } else if (value.every(isBoolean)) {
        valueType.push("boolean[];");
      } else {
        valueType.push("any[];");
      }
    }

    return valueType;
  }

  private isMultiArray(arrayTypes: string[]) {
    return arrayTypes.length > 1;
  }

  private isAllEqual(array: string[]) {
    return array.slice(1).every(partial(isEqual, array[0]));
  }

  private getMultiArrayBrackets(content: string[]): string {
    let jsonString = JSON.stringify(content);
    let brackets = "";

    for (let index = 0, length = jsonString.length; index < length; index++) {
      let element = jsonString[index];

      if (element === "[") {
        brackets = brackets + "[]";
      } else {
        index = length;
      }
    }

    return brackets;
  }

  private formatCharsToTypeScript(
    jsonContent: any,
    objectName: string,
    optionalKeys: string[]
  ): string {
    let result = JSON.stringify(jsonContent, null, "\t")
      .replace(new RegExp('"', "g"), "")
      .replace(new RegExp(",", "g"), "");

    let allKeys = Object.keys(jsonContent);
    for (let index = 0, length = allKeys.length; index < length; index++) {
      let key = allKeys[index];
      if (optionalKeys.includes(key)) {
        result = result.replace(new RegExp(key + ":", "g"), key + "?:");
      } else {
        result = result.replace(new RegExp(key + ":", "g"), key + ":");
      }
    }

    objectName = this.removeMajority(objectName);

    return "export interface " + objectName + " " + result;
  }

  private removeMajority(objectName: string): string {
    if (objectName.slice(-3).toUpperCase() === "IES") {
      return objectName.substring(0, objectName.length - 3) + "y";
    } else if (objectName.slice(-1).toUpperCase() === "S") {
      return objectName.substring(0, objectName.length - 1);
    }

    return objectName;
  }

  private toUpperFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private toLowerFirstLetter(text: string) {
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  isJson(stringContent: string): boolean {
    try {
      JSON.parse(stringContent);
    } catch (e) {
      return false;
    }
    return true;
  }
}
