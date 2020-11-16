interface IFieldNested<Parent, Child> {
  parent: Parent;
  child: Child;
}

export declare type FieldNested<Parent, Child> = IFieldNested<keyof Parent, keyof Child>;
