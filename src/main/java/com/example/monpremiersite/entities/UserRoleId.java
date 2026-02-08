package com.example.monpremiersite.entities;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserRoleId implements Serializable {

    private Long idu;
    private Long idr;

    public UserRoleId() {}

    public UserRoleId(Long idu, Long idr) {
        this.idu = idu;
        this.idr = idr;
    }

    public Long getIdu() { return idu; }
    public void setIdu(Long idu) { this.idu = idu; }

    public Long getIdr() { return idr; }
    public void setIdr(Long idr) { this.idr = idr; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserRoleId)) return false;
        UserRoleId that = (UserRoleId) o;
        return Objects.equals(idu, that.idu) && Objects.equals(idr, that.idr);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idu, idr);
    }
}
